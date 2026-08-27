#!/usr/bin/env node
/**
 * Upsert one editorial block from consolidado.json into SITE_DB.
 * Usage (from web/): node scripts/import-consolidado-block.mjs 23
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = resolve(__dirname, "..");
const REPO_ROOT = resolve(WEB_ROOT, "..");

const blockId = parseInt(process.argv[2], 10);
if (!Number.isFinite(blockId) || blockId < 1) {
  console.error("Usage: node scripts/import-consolidado-block.mjs <block-id>");
  process.exit(1);
}

const parse = spawnSync("node", ["scripts/parse-consolidado.mjs"], {
  cwd: WEB_ROOT,
  stdio: "inherit",
});
if (parse.status !== 0) process.exit(parse.status ?? 1);

const consolidadoPath = join(WEB_ROOT, "src/data/consolidado.json");
const { blocks } = JSON.parse(readFileSync(consolidadoPath, "utf8"));
const block = blocks.find((b) => b.id === blockId);
if (!block) {
  console.error(`Block ${blockId} not found in consolidado.json`);
  process.exit(1);
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

function deleteBlock(id) {
  const convIds = db
    .prepare(`SELECT id FROM dialogue_conversations WHERE block_id = ?`)
    .all(id)
    .map((r) => r.id);
  for (const cid of convIds) {
    db.prepare(`DELETE FROM dialogue_turns WHERE conversation_id = ?`).run(cid);
  }
  db.prepare(`DELETE FROM dialogue_conversations WHERE block_id = ?`).run(id);
  const structIds = db
    .prepare(`SELECT id FROM structure_lines WHERE block_id = ?`)
    .all(id)
    .map((r) => r.id);
  for (const sid of structIds) {
    db.prepare(`DELETE FROM structure_glosses WHERE structure_id = ?`).run(sid);
  }
  db.prepare(`DELETE FROM structure_lines WHERE block_id = ?`).run(id);
  db.prepare(`DELETE FROM vocab_entries WHERE block_id = ?`).run(id);
  db.prepare(`DELETE FROM block_notes WHERE block_id = ?`).run(id);
  db.prepare(`DELETE FROM block_differences WHERE block_id = ?`).run(id);
  db.prepare(`DELETE FROM block_priorities WHERE block_id = ?`).run(id);
  db.prepare(`DELETE FROM review_standalone_phrases WHERE block_id = ?`).run(id);
  db.prepare(`DELETE FROM content_blocks WHERE id = ?`).run(id);
}

const insertBlock = db.prepare(
  `INSERT INTO content_blocks (id, title, narrative, sort_order, payload_json) VALUES (?, ?, ?, ?, ?)`,
);
const insertVocab = db.prepare(
  `INSERT INTO vocab_entries (block_id, hanzi, pinyin, translation, sort_order) VALUES (?, ?, ?, ?, ?)`,
);
const insertStruct = db.prepare(
  `INSERT INTO structure_lines (block_id, hanzi, pinyin, sort_order) VALUES (?, ?, ?, ?)`,
);
const insertGloss = db.prepare(
  `INSERT INTO structure_glosses (structure_id, locale, gloss) VALUES (?, ?, ?)`,
);
const insertNote = db.prepare(`INSERT INTO block_notes (block_id, body, sort_order) VALUES (?, ?, ?)`);
const insertDiff = db.prepare(
  `INSERT INTO block_differences (block_id, body, sort_order) VALUES (?, ?, ?)`,
);
const insertPrio = db.prepare(
  `INSERT INTO block_priorities (block_id, body, sort_order) VALUES (?, ?, ?)`,
);
const insertStandalone = db.prepare(
  `INSERT INTO review_standalone_phrases (block_id, locale, body, sort_order) VALUES (?, ?, ?, ?)`,
);
const insertConv = db.prepare(`INSERT INTO dialogue_conversations (block_id, sort_order) VALUES (?, ?)`);
const insertTurn = db.prepare(
  `INSERT INTO dialogue_turns (conversation_id, sort_order, speaker, hanzi, pinyin, translation_pt, translation_en, translation_es)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
);

db.exec("BEGIN");
deleteBlock(blockId);
insertBlock.run(
  block.id,
  block.title,
  block.narrative ?? "",
  blockId - 1,
  JSON.stringify(block),
);

(block.vocabulary ?? []).forEach((v, j) => {
  insertVocab.run(blockId, v.hanzi, v.pinyin ?? "", v.translation ?? "", j);
});

const structures = block.structures ?? [];
const glosses = block.structureGlosses ?? { pt: [], en: [], es: [] };
structures.forEach((s, j) => {
  const r = insertStruct.run(blockId, s.hanzi, s.pinyin ?? "", j);
  const sid = Number(r.lastInsertRowid);
  for (const locale of ["pt", "en", "es"]) {
    const g = glosses[locale]?.[j];
    if (g != null && g !== "") insertGloss.run(sid, locale, g);
  }
});

(block.notes ?? []).forEach((body, j) => insertNote.run(blockId, body, j));
(block.differences ?? []).forEach((body, j) => insertDiff.run(blockId, body, j));
(block.priorities ?? []).forEach((body, j) => insertPrio.run(blockId, body, j));

const standalone = block.reviewStandalonePhrases ?? { pt: [], en: [], es: [] };
for (const locale of ["pt", "en", "es"]) {
  (standalone[locale] ?? []).forEach((body, j) =>
    insertStandalone.run(blockId, locale, body, j),
  );
}

(block.reviewMiniDialogues ?? []).forEach((conv, ci) => {
  const cr = insertConv.run(blockId, ci);
  const cid = Number(cr.lastInsertRowid);
  (conv ?? []).forEach((turn, ti) => {
    const tr = turn.translation ?? {};
    insertTurn.run(
      cid,
      ti,
      turn.speaker ?? "",
      turn.hanzi ?? "",
      turn.pinyin ?? "",
      typeof tr === "string" ? tr : (tr.pt ?? ""),
      typeof tr === "string" ? tr : (tr.en ?? ""),
      typeof tr === "string" ? tr : (tr.es ?? ""),
    );
  });
});
db.exec("COMMIT");
db.close();

console.log(`[import-consolidado-block] Block ${blockId} "${block.title}"`, {
  vocabulary: block.vocabulary?.length ?? 0,
  structures: block.structures?.length ?? 0,
  dialogues: block.reviewMiniDialogues?.length ?? 0,
});

const rebuild = spawnSync("node", ["scripts/seed-content-db.mjs"], {
  cwd: WEB_ROOT,
  env: { ...process.env, LEXICO_REBUILD: "1" },
  stdio: "inherit",
});
if (rebuild.status !== 0) process.exit(rebuild.status ?? 1);
console.log("[import-consolidado-block] Done. Run: npm run build:app-library");
