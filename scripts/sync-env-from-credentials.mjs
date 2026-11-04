#!/usr/bin/env node
/**
 * Regenera env a partir de local/credentials/credentials.json:
 *   - local/credentials/generated/web.auth.env.local       (dev 34827)
 *   - local/credentials/generated/web.auth.env.local-node  (local Node 34902)
 *   - local/credentials/generated/deploy.auth.env          (fragmento auth prod)
 *   - web/deploy/server.env                                (produção completo)
 *   - web/.env.local                                       (dev local completo)
 *
 * Uso (na raiz): node scripts/sync-env-from-credentials.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const WEB_DIR = join(REPO_ROOT, "web");

const CREDENTIALS = join(REPO_ROOT, "local", "credentials", "credentials.json");
const OUT_DIR = join(REPO_ROOT, "local", "credentials", "generated");
const OUT_LOCAL = join(OUT_DIR, "web.auth.env.local");
const OUT_LOCAL_NODE = join(OUT_DIR, "web.auth.env.local-node");
const OUT_PRODUCTION = join(OUT_DIR, "deploy.auth.env");
const SERVER_ENV = join(WEB_DIR, "deploy", "server.env");
const ENV_LOCAL = join(WEB_DIR, ".env.local");

function parseEnvFile(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    out[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return out;
}

function authBlock(data, mode) {
  const na = data.oauth_uri_contract?.nextauth_url_by_mode?.[mode];
  const g = data.google_oauth ?? {};
  const s = data.nextauth ?? {};
  const clientId = g.GOOGLE_CLIENT_ID || g.AUTH_GOOGLE_ID || "";
  return [
    "# chinese-learnin — learnchinese.today",
    `AUTH_TRUST_HOST=${s.AUTH_TRUST_HOST ?? "true"}`,
    `NEXTAUTH_URL=${na}`,
    `AUTH_URL=${na}`,
    `NEXTAUTH_SECRET=${s.NEXTAUTH_SECRET ?? s.AUTH_SECRET ?? ""}`,
    `AUTH_SECRET=${s.AUTH_SECRET ?? s.NEXTAUTH_SECRET ?? ""}`,
    `GOOGLE_CLIENT_ID=${clientId}`,
    `GOOGLE_CLIENT_SECRET=${g.GOOGLE_CLIENT_SECRET ?? g.AUTH_GOOGLE_SECRET ?? ""}`,
    `AUTH_GOOGLE_ID=${g.AUTH_GOOGLE_ID ?? clientId}`,
    `AUTH_GOOGLE_SECRET=${g.AUTH_GOOGLE_SECRET ?? g.GOOGLE_CLIENT_SECRET ?? ""}`,
    `NEXT_PUBLIC_GOOGLE_CLIENT_ID=${g.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? clientId}`,
  ];
}

function siteBlock(data) {
  const dep = data.deployment ?? {};
  const analytics = data.analytics ?? {};
  const basePath = dep.base_path ?? "";
  const gaId =
    analytics.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
    "G-2YMPSSQJND";
  return [
    "# --- Site (learnchinese.today)",
    `NEXT_PUBLIC_BASE_PATH=${basePath}`,
    `NEXT_PUBLIC_GA_MEASUREMENT_ID=${gaId}`,
  ];
}

/** Quote for bash `source` (spaces / <> in RESEND_FROM, etc.). */
function envAssign(key, value) {
  const v = String(value ?? "");
  if (/^[A-Za-z0-9_./:@+-]+$/.test(v)) return `${key}=${v}`;
  return `${key}=${JSON.stringify(v)}`;
}

/**
 * Website Alipay app only. File lives outside this repo
 * (`_credentials/alipay/learnchinese.json`, map `alipay.learnchinese`).
 * Shape (nov 2026): root = web app LearnChineseToday; `mobile_app` is the iOS
 * app and is ignored here. Older files used a nested `launched_app` block.
 */
function alipayCredentialsFile(data) {
  const fromEnv = process.env.ALIPAY_CREDENTIALS_FILE;
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
  const fromJson = data.alipay?.file;
  if (typeof fromJson === "string" && fromJson.trim()) {
    const abs = fromJson.startsWith("/") ? fromJson : join(REPO_ROOT, fromJson);
    if (existsSync(abs)) return abs;
  }
  const hub = join(homedir(), "Documents/Projects/blackair/_credentials/alipay/learnchinese.json");
  if (existsSync(hub)) return hub;
  return null;
}

let websiteAlipayCache;
function loadWebsiteAlipay(data) {
  if (websiteAlipayCache !== undefined) return websiteAlipayCache;
  const file = alipayCredentialsFile(data);
  if (!file) {
    websiteAlipayCache = null;
    return null;
  }
  let json;
  try {
    json = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    console.warn("[sync-env] WARN: could not read Alipay credentials file");
    websiteAlipayCache = null;
    return null;
  }
  // Prefer root (current). Fall back to nested launched_app from older copies.
  const app =
    json.app_id && json.application_private_key && json.alipay_public_key
      ? json
      : json.launched_app;
  if (!app?.app_id || !app.application_private_key || !app.alipay_public_key) {
    console.warn("[sync-env] WARN: Alipay file has no website app keys");
    websiteAlipayCache = null;
    return null;
  }
  if (json.app_type && String(json.app_type) !== "webpage" && app === json) {
    console.warn("[sync-env] WARN: Alipay root app_type is not webpage — env not written");
    websiteAlipayCache = null;
    return null;
  }
  websiteAlipayCache = {
    appId: String(app.app_id).trim(),
    privateKey: String(app.application_private_key).replace(/\s+/g, ""),
    publicKey: String(app.alipay_public_key).replace(/\s+/g, ""),
    gateway: String(json.gateway || app.gateway || "https://openapi.alipay.com/gateway.do").trim(),
  };
  console.log(`[sync-env] alipay website app ${websiteAlipayCache.appId}`);
  return websiteAlipayCache;
}

let mobileAlipayCache;
function loadMobileAlipay(data) {
  if (mobileAlipayCache !== undefined) return mobileAlipayCache;
  const file = alipayCredentialsFile(data);
  if (!file) {
    mobileAlipayCache = null;
    return null;
  }
  let json;
  try {
    json = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    mobileAlipayCache = null;
    return null;
  }
  const app = json.mobile_app;
  if (!app?.app_id || !app.application_private_key || !app.alipay_public_key) {
    mobileAlipayCache = null;
    return null;
  }
  const pid = String(app.pid || "").trim();
  if (!pid) {
    console.warn("[sync-env] WARN: alipay mobile_app.pid empty (2088…) — iOS SDK auth disabled until set");
  }
  mobileAlipayCache = {
    appId: String(app.app_id).trim(),
    pid,
    privateKey: String(app.application_private_key).replace(/\s+/g, ""),
    publicKey: String(app.alipay_public_key).replace(/\s+/g, ""),
  };
  console.log(`[sync-env] alipay mobile app ${mobileAlipayCache.appId}${pid ? "" : " (no pid)"}`);
  return mobileAlipayCache;
}

function alipayBlock(data) {
  const app = loadWebsiteAlipay(data);
  const mobile = loadMobileAlipay(data);
  const lines = [];
  if (!app) {
    lines.push(
      "# --- Alipay (site). root of _credentials/alipay/learnchinese.json",
      "# ALIPAY_APP_ID=",
      "# ALIPAY_APPLICATION_PRIVATE_KEY=",
      "# ALIPAY_PUBLIC_KEY=",
      "# NEXT_PUBLIC_AUTH_ALIPAY=1",
    );
  } else {
    lines.push(
      "# --- Alipay (site). website app — docs/05_autenticacao.md § Alipay",
      envAssign("ALIPAY_APP_ID", app.appId),
      envAssign("ALIPAY_APPLICATION_PRIVATE_KEY", app.privateKey),
      envAssign("ALIPAY_PUBLIC_KEY", app.publicKey),
      envAssign("ALIPAY_GATEWAY", app.gateway),
      "NEXT_PUBLIC_AUTH_ALIPAY=1",
    );
  }
  if (mobile?.pid) {
    lines.push(
      "# --- Alipay (iOS SDK). mobile_app block — APPID + pid + keys",
      envAssign("ALIPAY_MOBILE_APP_ID", mobile.appId),
      envAssign("ALIPAY_MOBILE_PID", mobile.pid),
      envAssign("ALIPAY_MOBILE_APPLICATION_PRIVATE_KEY", mobile.privateKey),
      envAssign("ALIPAY_MOBILE_PUBLIC_KEY", mobile.publicKey),
    );
  } else {
    lines.push(
      "# --- Alipay (iOS SDK). set mobile_app.pid (2088…) in learnchinese.json then re-sync",
      "# ALIPAY_MOBILE_APP_ID=",
      "# ALIPAY_MOBILE_PID=",
    );
  }
  return lines;
}

/** Accounts: Resend email, Apple, Google iOS client (docs/05_autenticacao.md § Contas). */
function accountBlock(data, existing) {
  const email = data.email ?? {};
  const apple = data.apple ?? {};
  const g = data.google_oauth ?? {};
  const pick = (value, key) => value || existing[key] || "";
  const resendKey = pick(email.RESEND_API_KEY, "RESEND_API_KEY");
  const appleId = pick(apple.AUTH_APPLE_ID, "AUTH_APPLE_ID");
  const appleSecret = pick(apple.AUTH_APPLE_SECRET, "AUTH_APPLE_SECRET");
  // The server signs its own client secret from the .p8 key (web/src/server/auth/apple-secret.ts).
  let appleKey = existing.AUTH_APPLE_PRIVATE_KEY || "";
  if (apple.private_key_file && !apple.private_key_file.includes("XXXXXXXXXX")) {
    const keyPath = join(REPO_ROOT, apple.private_key_file);
    if (existsSync(keyPath)) appleKey = readFileSync(keyPath, "utf8").trim().replace(/\n/g, "\\n");
    else console.warn(`[sync-env] WARN: apple.private_key_file not found: ${apple.private_key_file}`);
  }
  const appleTeam = pick(apple.team_id, "AUTH_APPLE_TEAM_ID");
  const appleKeyId = pick(apple.key_id, "AUTH_APPLE_KEY_ID");
  const appleReady = Boolean(appleId && (appleSecret || (appleKey && appleTeam && appleKeyId)));
  const from =
    pick(email.RESEND_FROM, "RESEND_FROM") ||
    "LearnChinese Today <no-reply@learnchinese.today>";
  return [
    "# --- Accounts (email + password, Apple, Google iOS)",
    resendKey
      ? envAssign("RESEND_API_KEY", resendKey)
      : "# RESEND_API_KEY=  # without it, emails are printed to the server log",
    envAssign("RESEND_FROM", from),
    envAssign(
      "APPLE_APP_BUNDLE_ID",
      pick(apple.APPLE_APP_BUNDLE_ID, "APPLE_APP_BUNDLE_ID") || "today.learnchinese.app",
    ),
    ...(appleReady
      ? [
          envAssign("AUTH_APPLE_ID", appleId),
          ...(appleSecret ? [envAssign("AUTH_APPLE_SECRET", appleSecret)] : []),
          ...(appleKey
            ? [
                envAssign("AUTH_APPLE_TEAM_ID", appleTeam),
                envAssign("AUTH_APPLE_KEY_ID", appleKeyId),
                envAssign("AUTH_APPLE_PRIVATE_KEY", appleKey),
              ]
            : []),
          "NEXT_PUBLIC_AUTH_APPLE=1",
        ]
      : ["# AUTH_APPLE_ID= + apple.key_id + apple.private_key_file  # Sign in with Apple on the site"]),
    ...(pick(g.GOOGLE_IOS_CLIENT_ID, "GOOGLE_IOS_CLIENT_ID")
      ? [envAssign("GOOGLE_IOS_CLIENT_ID", pick(g.GOOGLE_IOS_CLIENT_ID, "GOOGLE_IOS_CLIENT_ID"))]
      : ["# GOOGLE_IOS_CLIENT_ID=  # Google Sign-In in the iOS app"]),
  ];
}

function main() {
  let data;
  try {
    data = JSON.parse(readFileSync(CREDENTIALS, "utf8"));
  } catch {
    console.error("[sync-env] Missing local/credentials/credentials.json");
    process.exit(1);
  }

  const dep = data.deployment ?? {};
  const existingLocal = parseEnvFile(ENV_LOCAL);
  const existingServer = parseEnvFile(SERVER_ENV);
  const llm = data.llm ?? {};

  const llmToken =
    llm.LLM_API_TOKEN ||
    existingLocal.LLM_API_TOKEN ||
    existingServer.LLM_API_TOKEN ||
    "";
  const llmUrlLocal =
    llm.LLM_API_URL_LOCAL || existingLocal.LLM_API_URL || "http://127.0.0.1:28471";
  const llmUrlProd =
    llm.LLM_API_URL_PRODUCTION || existingServer.LLM_API_URL || "https://llm.webplace.cc";
  const ragPathLocal =
    llm.RAG_SOURCES_PATH ||
    existingLocal.RAG_SOURCES_PATH ||
    "";
  const ragPathProd = llm.RAG_SOURCES_PATH_PRODUCTION ?? "";

  const hanziApp = data.hanzi_app ?? {};
  const appLibraryToken =
    hanziApp.APP_LIBRARY_TOKEN ||
    existingLocal.APP_LIBRARY_TOKEN ||
    existingServer.APP_LIBRARY_TOKEN ||
    "";

  const site = siteBlock(data);
  const devAuth = authBlock(data, "dev");
  const localNodeAuth = authBlock(data, "local_node");
  const prodAuth = authBlock(data, "production");

  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(join(WEB_DIR, "deploy"), { recursive: true });

  const alipay = alipayBlock(data);
  writeFileSync(OUT_LOCAL, [...site, "", ...devAuth, "", ...alipay].join("\n") + "\n", "utf8");
  writeFileSync(OUT_LOCAL_NODE, [...site, "", ...localNodeAuth, "", ...alipay].join("\n") + "\n", "utf8");
  writeFileSync(OUT_PRODUCTION, [...site, "", ...prodAuth, "", ...alipay].join("\n") + "\n", "utf8");

  const hasGoogle =
    Boolean(data.google_oauth?.GOOGLE_CLIENT_ID || data.google_oauth?.AUTH_GOOGLE_ID) &&
    Boolean(data.google_oauth?.GOOGLE_CLIENT_SECRET || data.google_oauth?.AUTH_GOOGLE_SECRET);
  const hasAuthSecret = Boolean(data.nextauth?.AUTH_SECRET || data.nextauth?.NEXTAUTH_SECRET);

  const envLocalContent = [
    "# Gerado por scripts/sync-env-from-credentials.mjs — não commitar",
    "",
    "# --- LLM (dev Mac / Docker local)",
    `LLM_API_URL=${llmUrlLocal}`,
    ...(llmToken ? [`LLM_API_TOKEN=${llmToken}`] : ["# LLM_API_TOKEN="]),
    ...(ragPathLocal ? [`RAG_SOURCES_PATH=${ragPathLocal}`] : []),
    "",
    "# --- APP Hanzi Memorize library API",
    ...(appLibraryToken
      ? [`APP_LIBRARY_TOKEN=${appLibraryToken}`]
      : ["# APP_LIBRARY_TOKEN=  # credentials.json → hanzi_app.APP_LIBRARY_TOKEN"]),
    "",
    ...site,
    "",
    // Keep email/password + Google UI on for local Next when credentials exist.
    ...(hasGoogle && hasAuthSecret ? ["NEXT_PUBLIC_AUTH_ENABLED=1"] : ["# NEXT_PUBLIC_AUTH_ENABLED=1  # set when Google + AUTH_SECRET are present"]),
    "",
    ...devAuth,
    "",
    ...accountBlock(data, existingLocal),
    "",
    ...alipayBlock(data),
    "",
  ].join("\n");

  const serverEnvContent = [
    "# Gerado por scripts/sync-env-from-credentials.mjs — produção (./start.sh --prod)",
    "# gitignored — ver deploy/server.env.example",
    "",
    "# --- Process / nginx (127.0.0.1 = nginx no mesmo host; 0.0.0.0 = proxy Docker → bridge)",
    `HOSTNAME=${dep.server_hostname ?? "127.0.0.1"}`,
    `PORT=${dep.production_node_port ?? 34827}`,
    "",
    "# --- LLM (alcançável a partir do servidor)",
    `LLM_API_URL=${llmUrlProd}`,
    ...(llmToken ? [`LLM_API_TOKEN=${llmToken}`] : ["LLM_API_TOKEN="]),
    ...(ragPathProd ? [`RAG_SOURCES_PATH=${ragPathProd}`] : ["# RAG ingest is remote (llm.webplace.cc) — no local RAG_SOURCES_PATH on VM"]),
    "",
    "# --- APP Hanzi Memorize library API (docs/09_roadmap_integracoes.md)",
    ...(appLibraryToken
      ? [`APP_LIBRARY_TOKEN=${appLibraryToken}`]
      : ["# APP_LIBRARY_TOKEN="]),
    "",
    ...site,
    "",
    // App + site accounts (email/Google/Apple APIs). Undefined also means on; set explicitly.
    "NEXT_PUBLIC_AUTH_ENABLED=1",
    "",
    ...prodAuth,
    "",
    ...accountBlock(data, existingServer),
    "",
    ...alipayBlock(data),
    "",
  ].join("\n");

  writeFileSync(ENV_LOCAL, envLocalContent, "utf8");
  writeFileSync(SERVER_ENV, serverEnvContent, "utf8");

  console.log("[sync-env] OK:");
  console.log(" ", OUT_LOCAL);
  console.log(" ", OUT_LOCAL_NODE);
  console.log(" ", OUT_PRODUCTION);
  console.log(" ", ENV_LOCAL);
  console.log(" ", SERVER_ENV);
  if (!llmToken) {
    console.warn("[sync-env] WARN: LLM_API_TOKEN vazio — preenche em credentials.json → llm.LLM_API_TOKEN ou web/.env.local");
  }
  if (!appLibraryToken) {
    console.warn(
      "[sync-env] WARN: APP_LIBRARY_TOKEN vazio — alinhar com o app; credentials.json → hanzi_app.APP_LIBRARY_TOKEN",
    );
  }
}

main();
