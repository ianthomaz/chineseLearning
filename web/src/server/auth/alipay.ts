/**
 * Alipay website login (LearnChineseToday).
 *
 * openauth → `auth_code` → `/api/auth/alipay/callback` → RSA2
 * `alipay.system.oauth.token` (open_id) → optional `alipay.user.info.share`
 * (nick / avatar / email when Alipay returns one). Account id is always
 * `open_id`. Access token is used once for share, never stored.
 *
 * Keys: `_credentials/alipay/learnchinese.json` website root via sync-env.
 */
import {
  createPrivateKey,
  createPublicKey,
  createSign,
  createVerify,
  randomBytes,
  type KeyObject,
} from "node:crypto";
import { getPublicBasePath } from "@/lib/publicBasePath";

const AUTHORIZE_URL = "https://openauth.alipay.com/oauth2/publicAppAuthorize.htm";
const DEFAULT_GATEWAY = "https://openapi.alipay.com/gateway.do";

export const ALIPAY_STATE_COOKIE = "alipay_oauth_state";
export const ALIPAY_STATE_MAX_AGE = 10 * 60;

/**
 * Magic return path packed into the state cookie when the iOS app starts Alipay
 * via ASWebAuthenticationSession (`?client=ios`). The web callback then redirects
 * to the app URL scheme instead of a site page.
 */
export const ALIPAY_IOS_RETURN_PATH = "/__ios_alipay__";

/** Custom URL scheme registered on the iOS app (`Info.plist`). */
export const ALIPAY_IOS_CALLBACK_SCHEME = "today.learnchinese.app";

export type AlipayConfig = {
  appId: string;
  privateKey: KeyObject;
  alipayPublicKey: KeyObject;
  gateway: string;
  redirectUri: string;
};

export type AlipayTokenResult =
  | { ok: true; openId: string; accessToken: string }
  | { ok: false; reason: "bad_body" | "bad_sign" | "alipay_error" | "missing_open_id" | "http"; detail?: string };

/** Profile fields we keep from `alipay.user.info.share` (website docs omit email; accept it if present). */
export type AlipayProfile = {
  openId: string;
  email: string | null;
  name: string | null;
  image: string | null;
};

/** Beijing time, `yyyy-MM-dd HH:mm:ss`, which is what the gateway checks. */
export function alipayTimestamp(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  let hour = get("hour");
  if (hour === "24") hour = "00";
  return `${get("year")}-${get("month")}-${get("day")} ${hour}:${get("minute")}:${get("second")}`;
}

/** Sorted `key=value` pairs, excluding `sign` and empty values. Not URL-encoded. */
export function canonicalSignString(params: Record<string, string>): string {
  return Object.keys(params)
    .filter((key) => key !== "sign" && params[key] !== "")
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
}

export function signAlipay(params: Record<string, string>, privateKey: KeyObject): string {
  const signer = createSign("RSA-SHA256");
  signer.update(canonicalSignString(params));
  signer.end();
  return signer.sign(privateKey).toString("base64");
}

export function verifyAlipay(content: string, signature: string, publicKey: KeyObject): boolean {
  if (!content || !signature) return false;
  try {
    const verifier = createVerify("RSA-SHA256");
    verifier.update(content);
    verifier.end();
    return verifier.verify(publicKey, signature, "base64");
  } catch {
    return false;
  }
}

/** The raw JSON object Alipay signed — re-serialising would break the check. */
export function extractJsonNode(raw: string, node: string): string | null {
  const keyAt = raw.indexOf(`"${node}"`);
  if (keyAt < 0) return null;
  const start = raw.indexOf("{", keyAt + node.length + 2);
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < raw.length; i++) {
    const char = raw[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return raw.slice(start, i + 1);
    }
  }
  return null;
}

function responseSign(raw: string): string | null {
  const match = raw.match(/"sign"\s*:\s*"([^"]+)"/);
  return match?.[1] ?? null;
}

function subCodeOf(node: string): string | undefined {
  try {
    const parsed = JSON.parse(node) as { sub_code?: unknown; code?: unknown };
    if (typeof parsed.sub_code === "string" && parsed.sub_code) return parsed.sub_code;
    if (typeof parsed.code === "string" && parsed.code && parsed.code !== "10000") return parsed.code;
  } catch {
    return undefined;
  }
  return undefined;
}

function pickStr(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

/** Read a gateway body. `open_id` is accepted only after the signature matches. */
export function readTokenResponse(raw: string, publicKey: KeyObject): AlipayTokenResult {
  const signature = responseSign(raw);
  if (!signature) return { ok: false, reason: "bad_body" };

  const errorNode = extractJsonNode(raw, "error_response");
  if (errorNode) {
    if (!verifyAlipay(errorNode, signature, publicKey)) return { ok: false, reason: "bad_sign" };
    return { ok: false, reason: "alipay_error", detail: subCodeOf(errorNode) };
  }

  const tokenNode = extractJsonNode(raw, "alipay_system_oauth_token_response");
  if (!tokenNode) return { ok: false, reason: "bad_body" };
  if (!verifyAlipay(tokenNode, signature, publicKey)) return { ok: false, reason: "bad_sign" };

  let openId = "";
  let accessToken = "";
  let code = "";
  try {
    const parsed = JSON.parse(tokenNode) as {
      open_id?: unknown;
      access_token?: unknown;
      code?: unknown;
      user_id?: unknown;
      union_id?: unknown;
    };
    openId = pickStr(parsed.open_id) ?? "";
    accessToken = pickStr(parsed.access_token) ?? "";
    if (typeof parsed.code === "string") code = parsed.code;
    // Record availability only; never log identifiers, auth codes or tokens.
    console.info("[alipay] token identity fields", {
      open_id: Boolean(pickStr(parsed.open_id)),
      user_id: Boolean(pickStr(parsed.user_id)),
      union_id: Boolean(pickStr(parsed.union_id)),
    });
  } catch {
    return { ok: false, reason: "bad_body" };
  }
  if (code && code !== "10000") {
    return { ok: false, reason: "alipay_error", detail: subCodeOf(tokenNode) };
  }
  if (!openId) {
    return { ok: false, reason: "missing_open_id", detail: code && code !== "10000" ? code : undefined };
  }
  return { ok: true, openId, accessToken };
}

/**
 * Parse `alipay.user.info.share`. Email is not in the public website field list,
 * but if Alipay sends `email` / `email_address` we keep it as unverified profile data.
 */
export function readUserShareResponse(
  raw: string,
  publicKey: KeyObject,
  openId: string,
): AlipayProfile | null {
  const signature = responseSign(raw);
  if (!signature) return null;

  const errorNode = extractJsonNode(raw, "error_response");
  if (errorNode) {
    if (!verifyAlipay(errorNode, signature, publicKey)) return null;
    return null;
  }

  const shareNode = extractJsonNode(raw, "alipay_user_info_share_response");
  if (!shareNode) return null;
  if (!verifyAlipay(shareNode, signature, publicKey)) return null;

  try {
    const parsed = JSON.parse(shareNode) as Record<string, unknown>;
    if (typeof parsed.code === "string" && parsed.code && parsed.code !== "10000") return null;
    return {
      openId,
      email: pickStr(parsed.email, parsed.email_address),
      name: pickStr(parsed.nick_name, parsed.user_name),
      image: pickStr(parsed.avatar),
    };
  } catch {
    return null;
  }
}

export function alipayRedirectUri(): string | null {
  const origin = (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "");
  if (!origin) return null;
  return `${origin}${getPublicBasePath()}/api/auth/alipay/callback`;
}

function keyFromMaterial(kind: "private" | "public", material: string): KeyObject {
  const trimmed = material.trim().replace(/^"|"$/g, "").replace(/\\n/g, "\n");
  if (trimmed.includes("BEGIN")) {
    return kind === "private" ? createPrivateKey(trimmed) : createPublicKey(trimmed);
  }
  const body = trimmed.replace(/\s+/g, "");
  const lines = body.match(/.{1,64}/g)?.join("\n") ?? body;
  const label = kind === "private" ? "PRIVATE KEY" : "PUBLIC KEY";
  const pem = `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----`;
  return kind === "private" ? createPrivateKey(pem) : createPublicKey(pem);
}

/** Null when the launched app is not in the environment. */
export function alipayConfig(): AlipayConfig | null {
  const appId = process.env.ALIPAY_APP_ID?.trim() ?? "";
  const privateMaterial = process.env.ALIPAY_APPLICATION_PRIVATE_KEY ?? "";
  const publicMaterial = process.env.ALIPAY_PUBLIC_KEY ?? "";
  const redirectUri = alipayRedirectUri();
  if (!appId || !privateMaterial || !publicMaterial || !redirectUri) return null;
  try {
    return {
      appId,
      privateKey: keyFromMaterial("private", privateMaterial),
      alipayPublicKey: keyFromMaterial("public", publicMaterial),
      gateway: (process.env.ALIPAY_GATEWAY?.trim() || DEFAULT_GATEWAY).replace(/\/$/, ""),
      redirectUri,
    };
  } catch (err) {
    console.warn("[alipay] keys could not be read", err instanceof Error ? err.name : "error");
    return null;
  }
}

/**
 * iOS mobile app (bundle today.learnchinese.app). Same shape as website config
 * but no redirect URI — auth_code comes from AlipaySDK auth_V2.
 * Env: ALIPAY_MOBILE_APP_ID, ALIPAY_MOBILE_*_KEY, ALIPAY_MOBILE_PID (2088…).
 */
export type AlipayMobileConfig = {
  appId: string;
  pid: string;
  privateKey: KeyObject;
  alipayPublicKey: KeyObject;
  gateway: string;
};

export function alipayMobileConfig(): AlipayMobileConfig | null {
  const appId = process.env.ALIPAY_MOBILE_APP_ID?.trim() ?? "";
  const pid = process.env.ALIPAY_MOBILE_PID?.trim() ?? "";
  const privateMaterial = process.env.ALIPAY_MOBILE_APPLICATION_PRIVATE_KEY ?? "";
  const publicMaterial = process.env.ALIPAY_MOBILE_PUBLIC_KEY ?? "";
  if (!appId || !pid || !/^2088\d{12}$/.test(pid) || !privateMaterial || !publicMaterial) {
    return null;
  }
  try {
    return {
      appId,
      pid,
      privateKey: keyFromMaterial("private", privateMaterial),
      alipayPublicKey: keyFromMaterial("public", publicMaterial),
      gateway: (process.env.ALIPAY_GATEWAY?.trim() || DEFAULT_GATEWAY).replace(/\/$/, ""),
    };
  } catch (err) {
    console.warn("[alipay] mobile keys could not be read", err instanceof Error ? err.name : "error");
    return null;
  }
}

/**
 * Signed `infoStr` for AlipaySDK `auth_V2WithInfo:fromScheme:callback:`.
 * Private key never leaves the server. `target_id` is a one-time nonce from the app.
 */
export function buildMobileAuthInfoStr(config: AlipayMobileConfig, targetId: string): string {
  const params: Record<string, string> = {
    apiname: "com.alipay.account.auth",
    method: "alipay.open.auth.sdk.code.get",
    app_id: config.appId,
    app_name: "mc",
    biz_type: "openservice",
    pid: config.pid,
    product_id: "APP_FAST_LOGIN",
    scope: "kuaijie",
    target_id: targetId.slice(0, 32),
    auth_type: "AUTHACCOUNT",
    sign_type: "RSA2",
  };
  const sign = signAlipay(params, config.privateKey);
  return `${canonicalSignString(params)}&sign=${encodeURIComponent(sign)}`;
}

/** Exchange + profile using the **mobile** APPID keys (iOS SDK auth_code). */
export async function completeMobileAlipayLogin(
  authCode: string,
  config: AlipayMobileConfig,
): Promise<AlipayLoginResult> {
  const asWebsite: AlipayConfig = {
    appId: config.appId,
    privateKey: config.privateKey,
    alipayPublicKey: config.alipayPublicKey,
    gateway: config.gateway,
    redirectUri: "https://unused.invalid/",
  };
  return completeAlipayLogin(authCode, asWebsite);
}

export function alipayAuthorizeUrl(config: AlipayConfig, state: string): string {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("app_id", config.appId);
  url.searchParams.set("scope", "auth_user");
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("state", state);
  return url.toString();
}

async function postGateway(
  config: AlipayConfig,
  params: Record<string, string>,
): Promise<{ ok: true; raw: string } | { ok: false; reason: "http"; detail?: string }> {
  const sign = signAlipay(params, config.privateKey);
  const gateway = new URL(config.gateway);
  gateway.searchParams.set("charset", "utf-8");
  let response: Response;
  try {
    response = await fetch(gateway, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded;charset=utf-8" },
      body: new URLSearchParams({ ...params, sign }),
      cache: "no-store",
    });
  } catch {
    return { ok: false, reason: "http" };
  }
  const raw = await response.text();
  if (!response.ok) return { ok: false, reason: "http", detail: String(response.status) };
  return { ok: true, raw };
}

export async function exchangeAuthCode(authCode: string, config: AlipayConfig): Promise<AlipayTokenResult> {
  const posted = await postGateway(config, {
    app_id: config.appId,
    method: "alipay.system.oauth.token",
    format: "JSON",
    charset: "utf-8",
    sign_type: "RSA2",
    timestamp: alipayTimestamp(),
    version: "1.0",
    grant_type: "authorization_code",
    code: authCode,
  });
  if (!posted.ok) return posted;
  return readTokenResponse(posted.raw, config.alipayPublicKey);
}

/** Best-effort profile. Failure leaves open_id-only login intact. */
export async function fetchUserShare(
  accessToken: string,
  openId: string,
  config: AlipayConfig,
): Promise<AlipayProfile | null> {
  if (!accessToken) return { openId, email: null, name: null, image: null };
  const posted = await postGateway(config, {
    app_id: config.appId,
    method: "alipay.user.info.share",
    format: "JSON",
    charset: "utf-8",
    sign_type: "RSA2",
    timestamp: alipayTimestamp(),
    version: "1.0",
    auth_token: accessToken,
  });
  if (!posted.ok) return { openId, email: null, name: null, image: null };
  return (
    readUserShareResponse(posted.raw, config.alipayPublicKey, openId) ?? {
      openId,
      email: null,
      name: null,
      image: null,
    }
  );
}

export type AlipayLoginResult =
  | { ok: true; profile: AlipayProfile }
  | Extract<AlipayTokenResult, { ok: false }>;

/** Token exchange + optional share profile (Alipay email remains unverified). */
export async function completeAlipayLogin(
  authCode: string,
  config: AlipayConfig,
): Promise<AlipayLoginResult> {
  const exchanged = await exchangeAuthCode(authCode, config);
  if (!exchanged.ok) return exchanged;
  const profile =
    (await fetchUserShare(exchanged.accessToken, exchanged.openId, config)) ?? {
      openId: exchanged.openId,
      email: null,
      name: null,
      image: null,
    };
  return { ok: true, profile };
}

export function newOAuthState(): string {
  return randomBytes(32).toString("base64url");
}

export function isSafeReturnPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\") && !path.includes("://");
}

export function packStateCookie(state: string, returnPath: string): string {
  return `${state}.${Buffer.from(returnPath, "utf8").toString("base64url")}`;
}

export function unpackStateCookie(value: string): { state: string; returnPath: string } | null {
  const dot = value.indexOf(".");
  if (dot <= 0) return null;
  const state = value.slice(0, dot);
  if (!/^[A-Za-z0-9_-]+$/.test(state)) return null;
  try {
    const returnPath = Buffer.from(value.slice(dot + 1), "base64url").toString("utf8");
    if (!isSafeReturnPath(returnPath)) return null;
    return { state, returnPath };
  } catch {
    return null;
  }
}

/** Same path, with `authError=alipay` so the form can say the attempt stopped. */
export function withAuthError(path: string): string {
  const url = new URL(path, "http://local");
  url.searchParams.set("authError", "alipay");
  return `${url.pathname}${url.search}`;
}
