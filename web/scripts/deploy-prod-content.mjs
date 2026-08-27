#!/usr/bin/env node
/**
 * Incremental content sync for production SQLite (no FORCE_RESEED).
 * Run on the server after rsync, or locally before build:app-library.
 *
 * Usage (from web/): node scripts/deploy-prod-content.mjs
 */
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const WEB_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function run(label, args, extraEnv = {}) {
  console.log(`\n→ ${label}`);
  const r = spawnSync("node", args, {
    cwd: WEB_ROOT,
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run("consolidado block 23", ["scripts/import-consolidado-block.mjs", "23"]);
run("context deck cozinha", [
  "scripts/import-context-deck.mjs",
  "china_cozinha_2026-08-26",
]);
run("phrase bank from phrases.json", ["scripts/sync-phrase-bank-from-json.mjs"]);
run("app library snapshot", ["scripts/build-app-library.mjs"]);

console.log("\n[deploy-prod-content] Done.");
