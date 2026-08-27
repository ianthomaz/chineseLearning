#!/usr/bin/env node
/**
 * Import one phrase-game expansion batch into SITE_DB.
 * Runs build-phrase-game-data.mjs first, then upserts ids from the expansion file.
 *
 * Usage (from web/): node scripts/import-phrase-expansion.mjs expansion-08-cozinha
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = resolve(__dirname, "..");
const REPO_ROOT = resolve(WEB_ROOT, "..");

const batchName = process.argv[2];
if (!batchName) {
  console.error("Usage: node scripts/import-phrase-expansion.mjs <expansion-name-without-json>");
  process.exit(1);
}

const expansionPath = join(REPO_ROOT, "FRASES_GAME/curated", `${batchName}.json`);
if (!existsSync(expansionPath)) {
  console.error(`Missing ${expansionPath}`);
  process.exit(1);
}

const expansion = JSON.parse(readFileSync(expansionPath, "utf8"));
const ids = new Set((expansion.phrases ?? []).map((p) => p.id).filter(Boolean));
if (ids.size === 0) {
  console.error("No phrase ids in expansion file");
  process.exit(1);
}

const build = spawnSync("node", ["scripts/build-phrase-game-data.mjs"], {
  cwd: WEB_ROOT,
  stdio: "inherit",
});
if (build.status !== 0) process.exit(build.status ?? 1);

const phrasesPath = join(WEB_ROOT, "src/data/phrase-game/phrases.json");
const built = JSON.parse(readFileSync(phrasesPath, "utf8"));
const toImport = (built.phrases ?? []).filter((p) => ids.has(p.id));
if (toImport.length !== ids.size) {
  const missing = [...ids].filter((id) => !toImport.some((p) => p.id === id));
  console.warn("[import-phrase-expansion] Missing built phrases:", missing);
}

const { DatabaseSync } = await import("node:sqlite");

function dbPath() {
  return (
    process.env.SITE_DB ??
    process.env.PHRASE_GAME_DB ??
    join(WEB_ROOT, "data", "phrase-game.sqlite")
  );
}

const db = new DatabaseSync(dbPath());
db.exec("PRAGMA foreign_keys = ON;");
db.exec(`
CREATE TABLE IF NOT EXISTS phrase_game_phrases (
  id TEXT PRIMARY KEY, nivel INTEGER NOT NULL, tier TEXT NOT NULL, payload_json TEXT NOT NULL);
`);

const del = db.prepare(`DELETE FROM phrase_game_phrases WHERE id = ?`);
const ins = db.prepare(
  `INSERT INTO phrase_game_phrases (id, nivel, tier, payload_json) VALUES (?, ?, ?, ?)`,
);

db.exec("BEGIN");
for (const p of toImport) {
  del.run(p.id);
  ins.run(p.id, p.nivel, p.tier, JSON.stringify(p));
}
db.exec("COMMIT");
db.close();

console.log(`[import-phrase-expansion] Upserted ${toImport.length} phrases from ${batchName}.json`);
