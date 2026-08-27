#!/usr/bin/env node
/**
 * Upsert all phrases from src/data/phrase-game/phrases.json into SITE_DB.
 * Safe for production after rsync (merge by id).
 *
 * Usage (from web/): node scripts/sync-phrase-bank-from-json.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = resolve(__dirname, "..");
const phrasesPath = join(WEB_ROOT, "src/data/phrase-game/phrases.json");

function dbPath() {
  return (
    process.env.SITE_DB ??
    process.env.PHRASE_GAME_DB ??
    join(WEB_ROOT, "data", "phrase-game.sqlite")
  );
}

const built = JSON.parse(readFileSync(phrasesPath, "utf8"));
const phrases = built.phrases ?? [];
if (!phrases.length) {
  console.error("[sync-phrase-bank] phrases.json empty");
  process.exit(1);
}

const db = new DatabaseSync(dbPath());
db.exec(`
CREATE TABLE IF NOT EXISTS phrase_game_phrases (
  id TEXT PRIMARY KEY, nivel INTEGER NOT NULL, tier TEXT NOT NULL, payload_json TEXT NOT NULL);
`);

const del = db.prepare(`DELETE FROM phrase_game_phrases WHERE id = ?`);
const ins = db.prepare(
  `INSERT INTO phrase_game_phrases (id, nivel, tier, payload_json) VALUES (?, ?, ?, ?)`,
);

db.exec("BEGIN");
for (const p of phrases) {
  del.run(p.id);
  ins.run(p.id, p.nivel, p.tier, JSON.stringify(p));
}
db.exec("COMMIT");
db.close();

console.log(`[sync-phrase-bank] Upserted ${phrases.length} phrases from phrases.json`);
