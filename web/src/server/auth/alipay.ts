/**
 * Alipay website login (LearnChineseToday, launched app only).
 *
 * The button sends the browser to openauth. Alipay returns once, with
 * `auth_code`, to `/api/auth/alipay/callback`. This module signs
 * `alipay.system.oauth.token` (RSA2) and checks the reply with Alipay's
 * public key. The account id is `open_id`. The access token is not stored.
 *
 * Keys come from env, written by `scripts/sync-env-from-credentials.mjs`
 * from `_credentials/alipay/learnchinese.json` → `launched_app`. The older
 * app in that file is never read.
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

export type AlipayConfig = {
  appId: string;
  privateKey: KeyObject;
  alipayPublicKey: KeyObject;
  gateway: string;
  redirectUri: string;
};

export type AlipayTokenResult =
  | { ok: true; openId: string }
  | { ok: false; reason: "bad_body" | "bad_sign" | "alipay_error" | "missing_open_id" | "http"; detail?: string };

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
  let code = "";
  try {
    const parsed = JSON.parse(tokenNode) as { open_id?: unknown; code?: unknown };
    if (typeof parsed.open_id === "string") openId = parsed.open_id;
    if (typeof parsed.code === "string") code = parsed.code;
  } catch {
    return { ok: false, reason: "bad_body" };
  }
  if (!openId) {
    return { ok: false, reason: "missing_open_id", detail: code && code !== "10000" ? code : undefined };
  }
  return { ok: true, openId };
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

export function alipayAuthorizeUrl(config: AlipayConfig, state: string): string {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("app_id", config.appId);
  url.searchParams.set("scope", "auth_user");
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeAuthCode(authCode: string, config: AlipayConfig): Promise<AlipayTokenResult> {
  const params: Record<string, string> = {
    app_id: config.appId,
    method: "alipay.system.oauth.token",
    format: "JSON",
    charset: "utf-8",
    sign_type: "RSA2",
    timestamp: alipayTimestamp(),
    version: "1.0",
    grant_type: "authorization_code",
    code: authCode,
  };
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
  return readTokenResponse(raw, config.alipayPublicKey);
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
