#!/usr/bin/env node
/**
 * Dev server with hot reload. Disables Google auth client-side when AUTH_SECRET
 * is missing so SessionProvider does not 500 (guest mode still works).
 *
 * Force auth on: NEXT_PUBLIC_AUTH_ENABLED=1 npm run dev
 */
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const WEB_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(name) {
  const p = path.join(WEB_DIR, name);
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(trimmed);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

process.env.NEXT_PUBLIC_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/aulaChines";

const hasSecret = Boolean(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET);
const clientId = process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID || "";
const authForced = process.env.NEXT_PUBLIC_AUTH_ENABLED === "1";

if (clientId && !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = clientId;
}

const authReady = hasSecret && clientId;

if (!authReady && !authForced) {
  process.env.NEXT_PUBLIC_AUTH_ENABLED = "0";
  console.log(
    "→ Auth off (need AUTH_SECRET + GOOGLE_CLIENT_ID in web/.env.local).\n" +
      "  Setup: docs/09_google_auth_jogo.md → node scripts/sync-env-from-credentials.mjs\n" +
      "  Force try: NEXT_PUBLIC_AUTH_ENABLED=1 npm run dev",
  );
}

const nextBin = path.join(WEB_DIR, "node_modules", ".bin", "next");
if (!fs.existsSync(nextBin)) {
  console.error("Missing Next.js — run npm ci in web/");
  process.exit(1);
}

const child = spawn(
  nextBin,
  ["dev", "--turbopack", "-p", "34827"],
  { stdio: "inherit", env: process.env, cwd: WEB_DIR },
);

child.on("exit", (code) => process.exit(code ?? 0));
