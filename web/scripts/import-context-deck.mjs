#!/usr/bin/env node
/**
 * Import one context deck JSON into SITE_DB and rebuild lexico_entries.
 * Usage (from web/): node scripts/import-context-deck.mjs china_cozinha_2026-08-26
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = resolve(__dirname, "..");
const deckId = process.argv[2];

if (!deckId) {
  console.error("Usage: node scripts/import-context-deck.mjs <deck-id>");
  process.exit(1);
}

const deckPath = join(WEB_ROOT, "src/data/context-decks", `${deckId}.json`);
const indexPath = join(WEB_ROOT, "src/data/context-decks/index.json");

if (!existsSync(deckPath)) {
  console.error(`Missing ${deckPath}`);
  process.exit(1);
}

const deck = JSON.parse(readFileSync(deckPath, "utf8"));
const index = JSON.parse(readFileSync(indexPath, "utf8"));
const meta = (index.decks ?? []).find((d) => d.id === deckId);
if (!meta) {
  console.error(`Deck ${deckId} not listed in index.json`);
  process.exit(1);
}

// Dynamic import of sqlite after path check
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
CREATE TABLE IF NOT EXISTS context_decks (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS context_deck_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT, deck_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0, word TEXT NOT NULL, pinyin TEXT NOT NULL DEFAULT '',
  meaning TEXT NOT NULL DEFAULT '', section TEXT, pattern TEXT, pattern_label TEXT,
  sentence TEXT, sentence_pinyin TEXT, sentence_meaning TEXT,
  related TEXT, patterns TEXT, notes TEXT);
`);

const sortOrder =
  (index.decks ?? []).findIndex((d) => d.id === deckId) >= 0
    ? (index.decks ?? []).findIndex((d) => d.id === deckId)
    : 999;

db.exec("BEGIN");
db.prepare(`DELETE FROM context_deck_cards WHERE deck_id = ?`).run(deckId);
db.prepare(`DELETE FROM context_decks WHERE id = ?`).run(deckId);
db.prepare(
  `INSERT INTO context_decks (id, title, description, sort_order) VALUES (?, ?, ?, ?)`,
).run(deckId, deck.title ?? meta.title, meta.description ?? "", sortOrder);

const insertCard = db.prepare(
  `INSERT INTO context_deck_cards
    (deck_id, sort_order, word, pinyin, meaning, section, pattern, pattern_label,
     sentence, sentence_pinyin, sentence_meaning, related, patterns, notes)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);

(deck.cards ?? []).forEach((c, ci) => {
  insertCard.run(
    deckId,
    ci,
    c.word ?? "",
    c.pinyin ?? "",
    c.meaning ?? "",
    c.section ?? null,
    c.pattern ?? null,
    c.patternLabel ?? null,
    c.sentence ?? null,
    c.sentencePinyin ?? null,
    c.sentenceMeaning ?? null,
    c.related ?? null,
    c.patterns ?? null,
    c.notes ?? null,
  );
});
db.exec("COMMIT");
db.close();

console.log(`[import-context-deck] Imported ${deck.cards?.length ?? 0} cards → ${deckId}`);

const rebuild = spawnSync("node", ["scripts/seed-content-db.mjs"], {
  cwd: WEB_ROOT,
  env: { ...process.env, LEXICO_REBUILD: "1" },
  stdio: "inherit",
});

if (rebuild.status !== 0) process.exit(rebuild.status ?? 1);

console.log("[import-context-deck] Done. Run: npm run build:app-library");
