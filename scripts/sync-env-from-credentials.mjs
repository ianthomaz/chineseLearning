#!/usr/bin/env node
/**
 * Regenera a partir de local/credentials/credentials.json:
 *   - local/credentials/generated/web.auth.env.local
 *   - local/credentials/generated/deploy.auth.env
 *
 * Uso (na raiz do repo): node scripts/sync-env-from-credentials.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const CREDENTIALS = join(REPO_ROOT, "local", "credentials", "credentials.json");
const OUT_DIR = join(REPO_ROOT, "local", "credentials", "generated");
const OUT_LOCAL = join(OUT_DIR, "web.auth.env.local");
const OUT_PRODUCTION = join(OUT_DIR, "deploy.auth.env");

function main() {
  let raw;
  try {
    raw = readFileSync(CREDENTIALS, "utf8");
  } catch {
    console.error(
      "[sync-env] Missing local/credentials/credentials.json — copy from credentials.example.json",
    );
    process.exit(1);
  }

  const data = JSON.parse(raw);

  const localLines = data?.web_env_local?.lines;
  const prodLines = data?.web_env_production?.lines;

  if (!Array.isArray(localLines) || localLines.length === 0) {
    console.error(
      "[sync-env] credentials.json: missing web_env_local.lines (non-empty array).",
    );
    process.exit(1);
  }
  if (!Array.isArray(prodLines) || prodLines.length === 0) {
    console.error(
      "[sync-env] credentials.json: missing web_env_production.lines (non-empty array).",
    );
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_LOCAL, localLines.join("\n") + "\n", "utf8");
  writeFileSync(OUT_PRODUCTION, prodLines.join("\n") + "\n", "utf8");

  console.log("[sync-env] OK:");
  console.log("  ", OUT_LOCAL);
  console.log("  ", OUT_PRODUCTION);
  console.log("");
  console.log("Next: merge into web/.env.local and web/deploy/server.env");
  console.log("  cat local/credentials/generated/web.auth.env.local >> web/.env.local");
}

main();
