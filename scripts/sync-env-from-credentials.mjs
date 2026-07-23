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

function envLines(map, keys) {
  return keys.filter((k) => map[k] != null && map[k] !== "").map((k) => `${k}=${map[k]}`);
}

function authBlock(data, mode) {
  const na = data.oauth_uri_contract?.nextauth_url_by_mode?.[mode];
  const g = data.google_oauth ?? {};
  const s = data.nextauth ?? {};
  const clientId = g.GOOGLE_CLIENT_ID || g.AUTH_GOOGLE_ID || "";
  return [
    "# ChineseSite — auth",
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
  const ragPath =
    llm.RAG_SOURCES_PATH ||
    existingLocal.RAG_SOURCES_PATH ||
    existingServer.RAG_SOURCES_PATH ||
    "";

  // APP Hanzi Memorize library API — never invent a token; preserve or copy from credentials.
  const hanziApp = data.hanzi_app ?? {};
  const appLibraryToken =
    hanziApp.APP_LIBRARY_TOKEN ||
    existingLocal.APP_LIBRARY_TOKEN ||
    existingServer.APP_LIBRARY_TOKEN ||
    "";

  const devAuth = authBlock(data, "dev");
  const localNodeAuth = authBlock(data, "local_node");
  const prodAuth = authBlock(data, "production");

  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(join(WEB_DIR, "deploy"), { recursive: true });

  writeFileSync(OUT_LOCAL, devAuth.join("\n") + "\n", "utf8");
  writeFileSync(OUT_LOCAL_NODE, localNodeAuth.join("\n") + "\n", "utf8");
  writeFileSync(OUT_PRODUCTION, prodAuth.join("\n") + "\n", "utf8");

  const envLocalContent = [
    "# Gerado por scripts/sync-env-from-credentials.mjs — não commitar",
    "",
    "# --- LLM (dev Mac / Docker local)",
    `LLM_API_URL=${llmUrlLocal}`,
    ...(llmToken ? [`LLM_API_TOKEN=${llmToken}`] : ["# LLM_API_TOKEN="]),
    ...(ragPath ? [`RAG_SOURCES_PATH=${ragPath}`] : []),
    "",
    "# --- APP Hanzi Memorize library API",
    ...(appLibraryToken
      ? [`APP_LIBRARY_TOKEN=${appLibraryToken}`]
      : ["# APP_LIBRARY_TOKEN=  # credentials.json → hanzi_app.APP_LIBRARY_TOKEN"]),
    "",
    ...devAuth,
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
    ...(ragPath ? [`RAG_SOURCES_PATH=${ragPath}`] : []),
    "",
    "# --- APP Hanzi Memorize library API (docs/14_app_library_contract.md)",
    ...(appLibraryToken
      ? [`APP_LIBRARY_TOKEN=${appLibraryToken}`]
      : ["# APP_LIBRARY_TOKEN="]),
    "",
    ...prodAuth,
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
