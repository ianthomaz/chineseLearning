#!/usr/bin/env node
/**
 * Idempotent seed: JSON/curated sources → SITE_DB (SQLite).
 *
 * Usage (from web/):
 *   npm run seed:content
 *   SITE_DB=/path/to/db.sqlite npm run seed:content
 *
 * Prerequisites: consolidado.json + phrase-game phrases (run prebuild parsers first).
 */
import { mkdirSync, readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = resolve(__dirname, "..");
const REPO_ROOT = resolve(WEB_ROOT, "..");

function dbPath() {
  return (
    process.env.SITE_DB ??
    process.env.PHRASE_GAME_DB ??
    join(WEB_ROOT, "data", "phrase-game.sqlite")
  );
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function openDb() {
  const path = dbPath();
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA foreign_keys = ON;");
  // Ensure content tables exist even if Next has not opened the DB yet.
  // Full MIGRATION also runs on getDb() in the app.
  db.exec(`
CREATE TABLE IF NOT EXISTS content_blocks (
  id INTEGER PRIMARY KEY, title TEXT NOT NULL, narrative TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0, payload_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS vocab_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT, block_id INTEGER NOT NULL,
  hanzi TEXT NOT NULL, pinyin TEXT NOT NULL DEFAULT '', translation TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS structure_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT, block_id INTEGER NOT NULL,
  hanzi TEXT NOT NULL, pinyin TEXT NOT NULL DEFAULT '', sort_order INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS structure_glosses (
  structure_id INTEGER NOT NULL, locale TEXT NOT NULL, gloss TEXT NOT NULL,
  PRIMARY KEY (structure_id, locale));
CREATE TABLE IF NOT EXISTS block_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT, block_id INTEGER NOT NULL, body TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS block_differences (
  id INTEGER PRIMARY KEY AUTOINCREMENT, block_id INTEGER NOT NULL, body TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS block_priorities (
  id INTEGER PRIMARY KEY AUTOINCREMENT, block_id INTEGER NOT NULL, body TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS review_standalone_phrases (
  id INTEGER PRIMARY KEY AUTOINCREMENT, block_id INTEGER NOT NULL, locale TEXT NOT NULL, body TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS dialogue_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT, block_id INTEGER NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS dialogue_turns (
  id INTEGER PRIMARY KEY AUTOINCREMENT, conversation_id INTEGER NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0,
  speaker TEXT NOT NULL DEFAULT '', hanzi TEXT NOT NULL DEFAULT '', pinyin TEXT NOT NULL DEFAULT '',
  translation_pt TEXT NOT NULL DEFAULT '', translation_en TEXT NOT NULL DEFAULT '', translation_es TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS phrase_game_phrases (
  id TEXT PRIMARY KEY, nivel INTEGER NOT NULL, tier TEXT NOT NULL, payload_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS quiz_bank_meta (
  id INTEGER PRIMARY KEY CHECK (id = 1), payload_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS quiz_questions (
  id INTEGER PRIMARY KEY, type TEXT NOT NULL, difficulty INTEGER NOT NULL DEFAULT 1,
  block INTEGER, payload_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS global_dialogue_sections (
  id TEXT PRIMARY KEY, category_id INTEGER, sort_order INTEGER NOT NULL DEFAULT 0, payload_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS visual_pdf_entries (
  id TEXT PRIMARY KEY, file TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0, payload_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY, volume_label TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0);
INSERT OR IGNORE INTO books (id, volume_label, sort_order) VALUES
  ('primary-up', '初级·上', 1), ('primary-down', '初级·下', 2);
CREATE TABLE IF NOT EXISTS book_vocab_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT, book_id TEXT NOT NULL, lesson INTEGER NOT NULL,
  source TEXT NOT NULL, hanzi TEXT NOT NULL, pinyin TEXT, pos TEXT, gloss_en TEXT,
  examples_json TEXT, sort_order INTEGER NOT NULL DEFAULT 0);
`);
  return db;
}

function clearEditorial(db) {
  db.exec(`
    DELETE FROM dialogue_turns;
    DELETE FROM dialogue_conversations;
    DELETE FROM review_standalone_phrases;
    DELETE FROM block_priorities;
    DELETE FROM block_differences;
    DELETE FROM block_notes;
    DELETE FROM structure_glosses;
    DELETE FROM structure_lines;
    DELETE FROM vocab_entries;
    DELETE FROM content_blocks;
  `);
}

function seedEditorial(db) {
  const consolidadoPath = join(WEB_ROOT, "src/data/consolidado.json");
  if (!existsSync(consolidadoPath)) {
    throw new Error(`Missing ${consolidadoPath} — run: node scripts/parse-consolidado.mjs`);
  }
  const { blocks } = readJson(consolidadoPath);
  clearEditorial(db);

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
  const insertNote = db.prepare(
    `INSERT INTO block_notes (block_id, body, sort_order) VALUES (?, ?, ?)`,
  );
  const insertDiff = db.prepare(
    `INSERT INTO block_differences (block_id, body, sort_order) VALUES (?, ?, ?)`,
  );
  const insertPrio = db.prepare(
    `INSERT INTO block_priorities (block_id, body, sort_order) VALUES (?, ?, ?)`,
  );
  const insertStandalone = db.prepare(
    `INSERT INTO review_standalone_phrases (block_id, locale, body, sort_order) VALUES (?, ?, ?, ?)`,
  );
  const insertConv = db.prepare(
    `INSERT INTO dialogue_conversations (block_id, sort_order) VALUES (?, ?)`,
  );
  const insertTurn = db.prepare(
    `INSERT INTO dialogue_turns (conversation_id, sort_order, speaker, hanzi, pinyin, translation_pt, translation_en, translation_es)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  db.exec("BEGIN");
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    insertBlock.run(b.id, b.title, b.narrative ?? "", i, JSON.stringify(b));

    (b.vocabulary ?? []).forEach((v, j) => {
      insertVocab.run(b.id, v.hanzi, v.pinyin ?? "", v.translation ?? "", j);
    });

    const structures = b.structures ?? [];
    const glosses = b.structureGlosses ?? { pt: [], en: [], es: [] };
    structures.forEach((s, j) => {
      const r = insertStruct.run(b.id, s.hanzi, s.pinyin ?? "", j);
      const sid = Number(r.lastInsertRowid);
      for (const locale of ["pt", "en", "es"]) {
        const g = glosses[locale]?.[j];
        if (g != null && g !== "") insertGloss.run(sid, locale, g);
      }
    });

    (b.notes ?? []).forEach((body, j) => insertNote.run(b.id, body, j));
    (b.differences ?? []).forEach((body, j) => insertDiff.run(b.id, body, j));
    (b.priorities ?? []).forEach((body, j) => insertPrio.run(b.id, body, j));

    const standalone = b.reviewStandalonePhrases ?? { pt: [], en: [], es: [] };
    for (const locale of ["pt", "en", "es"]) {
      (standalone[locale] ?? []).forEach((body, j) =>
        insertStandalone.run(b.id, locale, body, j),
      );
    }

    (b.reviewMiniDialogues ?? []).forEach((conv, ci) => {
      const cr = insertConv.run(b.id, ci);
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
  }
  db.exec("COMMIT");
  return blocks.length;
}

function seedPhrases(db) {
  const path = join(WEB_ROOT, "src/data/phrase-game/phrases.json");
  if (!existsSync(path)) {
    throw new Error(`Missing ${path} — run: npm run prebuild:phrase-game`);
  }
  const bank = readJson(path);
  db.exec("DELETE FROM phrase_game_phrases");
  const insert = db.prepare(
    `INSERT INTO phrase_game_phrases (id, nivel, tier, payload_json) VALUES (?, ?, ?, ?)`,
  );
  db.exec("BEGIN");
  for (const p of bank.phrases ?? []) {
    insert.run(p.id, p.nivel, p.tier, JSON.stringify(p));
  }
  db.exec("COMMIT");
  return (bank.phrases ?? []).length;
}

function seedQuiz(db) {
  const path = join(WEB_ROOT, "src/data/gamification/hsk1-quiz-bank.json");
  const bank = readJson(path);
  db.exec("DELETE FROM quiz_questions; DELETE FROM quiz_bank_meta;");
  db.prepare(`INSERT INTO quiz_bank_meta (id, payload_json) VALUES (1, ?)`).run(
    JSON.stringify(bank),
  );
  const insert = db.prepare(
    `INSERT INTO quiz_questions (id, type, difficulty, block, payload_json) VALUES (?, ?, ?, ?, ?)`,
  );
  db.exec("BEGIN");
  for (const q of bank.questions ?? []) {
    insert.run(q.id, q.type, q.difficulty ?? 1, q.block ?? null, JSON.stringify(q));
  }
  db.exec("COMMIT");
  return (bank.questions ?? []).length;
}

function seedDialogues(db) {
  const main = readJson(join(WEB_ROOT, "src/data/global-dialogues.json"));
  const extra = readJson(join(WEB_ROOT, "src/data/global-dialogues-extra.json"));
  const sections = [...(main.sections ?? []), ...(extra.sections ?? [])];
  db.exec("DELETE FROM global_dialogue_sections");
  const insert = db.prepare(
    `INSERT INTO global_dialogue_sections (id, category_id, sort_order, payload_json) VALUES (?, ?, ?, ?)`,
  );
  db.exec("BEGIN");
  sections.forEach((sec, i) => {
    insert.run(
      sec.id,
      typeof sec.categoryId === "number" ? sec.categoryId : null,
      i,
      JSON.stringify(sec),
    );
  });
  db.exec("COMMIT");
  return sections.length;
}

function seedVisuals(db) {
  const raw = readJson(join(WEB_ROOT, "src/data/vocabulary-pdf-downloads.json"));
  const descriptions = readJson(
    join(WEB_ROOT, "src/data/vocabulary-pdf-descriptions.json"),
  );
  db.exec("DELETE FROM visual_pdf_entries");
  const insert = db.prepare(
    `INSERT INTO visual_pdf_entries (id, file, sort_order, payload_json) VALUES (?, ?, ?, ?)`,
  );
  db.exec("BEGIN");
  (raw.pdfs ?? []).forEach((row, i) => {
    const d = descriptions[row.file];
    const merged = d
      ? { ...row, desc_pt: d.pt, desc_en: d.en, desc_es: d.es }
      : row;
    insert.run(row.id, row.file, i, JSON.stringify(merged));
  });
  db.exec("COMMIT");
  return (raw.pdfs ?? []).length;
}

function seedBooks(db) {
  const curatedRoot = join(REPO_ROOT, "OrganizeVocabulary_books/curated");
  db.exec("DELETE FROM book_vocab_entries");
  const insert = db.prepare(
    `INSERT INTO book_vocab_entries
      (book_id, lesson, source, hanzi, pinyin, pos, gloss_en, examples_json, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  let count = 0;
  db.exec("BEGIN");
  for (const bookId of ["primary-up", "primary-down"]) {
    const dir = join(curatedRoot, bookId);
    if (!existsSync(dir)) continue;
    const files = readdirSync(dir)
      .filter((f) => /^lesson-\d+\.json$/.test(f))
      .sort();
    for (const file of files) {
      const lesson = readJson(join(dir, file));
      const lessonNum = lesson.meta?.lesson ?? Number(file.match(/\d+/)?.[0]);
      const bls = lesson.byLessonSource ?? {};
      let order = 0;
      for (const source of ["text", "extension"]) {
        for (const e of bls[source] ?? []) {
          insert.run(
            bookId,
            lessonNum,
            source,
            e.hanzi,
            e.pinyin ?? null,
            e.pos ?? null,
            e.glossEn ?? null,
            JSON.stringify(e.examples ?? []),
            order++,
          );
          count++;
        }
      }
      for (const g of bls.produce?.groups ?? []) {
        for (const hanzi of [...(g.core ?? []), ...(g.supplement ?? [])]) {
          insert.run(
            bookId,
            lessonNum,
            "produce",
            hanzi,
            null,
            null,
            g.theme ? `theme:${g.theme}` : null,
            JSON.stringify([]),
            order++,
          );
          count++;
        }
      }
    }
  }
  db.exec("COMMIT");
  return count;
}

function main() {
  const path = dbPath();
  console.log(`Seeding content DB: ${path}`);
  const db = openDb();
  const counts = {
    blocks: seedEditorial(db),
    phrases: seedPhrases(db),
    quizQuestions: seedQuiz(db),
    dialogueSections: seedDialogues(db),
    visualPdfs: seedVisuals(db),
    bookVocab: seedBooks(db),
  };
  db.close();
  console.log("Seed complete:", counts);
}

main();
