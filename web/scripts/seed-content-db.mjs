#!/usr/bin/env node
/**
 * Content bootstrap → SITE_DB (SQLite).
 *
 * SQL is the source of truth for editorial content. This script ONLY fills
 * EMPTY tables (or sections). It will NOT overwrite SQL edits unless:
 *   FORCE_RESEED=1 npm run seed:content
 *
 * Bootstrap inputs (archive — do not edit for site content):
 *   consolidado.json, phrase-game, quiz, dialogues, visuals, book curated,
 *   context-decks/*.json, APP_hanziMemorize/lexico.json
 *
 * Edit live content: npm run db:studio
 *
 * Usage (from web/):
 *   npm run seed:content
 *   SITE_DB=/path/to/db.sqlite npm run seed:content
 *   FORCE_RESEED=1 npm run seed:content
 */
import { mkdirSync, readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import {
  ROTATION_CATEGORIES,
  MAX_HANZI_LENGTH,
  EXCLUDED_SOURCE_BLOCK_IDS,
} from "./lexico-rotation-config.mjs";
import { LEXICO_CATEGORY_ASSIGNMENTS } from "./lexico-category-assignments.mjs";

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

const FORCE_RESEED = process.env.FORCE_RESEED === "1";

function tableCount(db, table) {
  const row = db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get();
  return Number(row?.c ?? 0);
}

function shouldSeed(db, table) {
  if (FORCE_RESEED) return true;
  return tableCount(db, table) === 0;
}

function openDb() {
  const path = dbPath();
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA foreign_keys = ON;");
  // Ensure content tables exist even if Next has not opened the DB yet.
  // Full MIGRATION also runs on getDb() in the app. Prisma schema mirrors these.
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
CREATE TABLE IF NOT EXISTS context_decks (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS context_deck_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT, deck_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0, word TEXT NOT NULL, pinyin TEXT NOT NULL DEFAULT '',
  meaning TEXT NOT NULL DEFAULT '', section TEXT, pattern TEXT, pattern_label TEXT,
  sentence TEXT, sentence_pinyin TEXT, sentence_meaning TEXT, related TEXT, patterns TEXT, notes TEXT);
CREATE TABLE IF NOT EXISTS lexico_rotation_categories (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, source_block_ids TEXT NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS lexico_entries (
  id TEXT PRIMARY KEY, hanzi TEXT NOT NULL, pinyin TEXT NOT NULL DEFAULT '',
  translation TEXT NOT NULL DEFAULT '', hanzi_length INTEGER NOT NULL,
  source_block_id INTEGER NOT NULL, source_block_title TEXT NOT NULL DEFAULT '',
  rotation_category_id TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0);
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
  if (!shouldSeed(db, "content_blocks")) {
    console.log(`[seed] content_blocks already has ${tableCount(db, "content_blocks")} rows — skip (SQL SoT)`);
    return tableCount(db, "content_blocks");
  }
  const consolidadoPath = join(WEB_ROOT, "src/data/consolidado.json");
  if (!existsSync(consolidadoPath)) {
    throw new Error(`Missing ${consolidadoPath} — run: node scripts/parse-consolidado.mjs`);
  }
  const { blocks } = readJson(consolidadoPath);
  if (!Array.isArray(blocks) || blocks.length === 0) {
    console.warn("[seed] consolidado.json has 0 blocks — skipping editorial (DB preserved)");
    return 0;
  }
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
  if (!shouldSeed(db, "phrase_game_phrases")) {
    console.log(`[seed] phrase_game_phrases already has ${tableCount(db, "phrase_game_phrases")} rows — skip`);
    return tableCount(db, "phrase_game_phrases");
  }
  const path = join(WEB_ROOT, "src/data/phrase-game/phrases.json");
  if (!existsSync(path)) {
    throw new Error(`Missing ${path} — run: npm run prebuild:phrase-game`);
  }
  const bank = readJson(path);
  const phrases = bank.phrases ?? [];
  if (phrases.length === 0) {
    console.warn("[seed] phrases.json empty — skipping phrase_game_phrases (DB preserved)");
    return 0;
  }
  db.exec("DELETE FROM phrase_game_phrases");
  const insert = db.prepare(
    `INSERT INTO phrase_game_phrases (id, nivel, tier, payload_json) VALUES (?, ?, ?, ?)`,
  );
  db.exec("BEGIN");
  for (const p of phrases) {
    insert.run(p.id, p.nivel, p.tier, JSON.stringify(p));
  }
  db.exec("COMMIT");
  return phrases.length;
}

function seedQuiz(db) {
  if (!shouldSeed(db, "quiz_questions")) {
    console.log(`[seed] quiz_questions already has ${tableCount(db, "quiz_questions")} rows — skip`);
    return tableCount(db, "quiz_questions");
  }
  const path = join(WEB_ROOT, "src/data/gamification/hsk1-quiz-bank.json");
  const bank = readJson(path);
  const questions = bank.questions ?? [];
  if (questions.length === 0) {
    console.warn("[seed] quiz bank empty — skipping quiz tables (DB preserved)");
    return 0;
  }
  db.exec("DELETE FROM quiz_questions; DELETE FROM quiz_bank_meta;");
  db.prepare(`INSERT INTO quiz_bank_meta (id, payload_json) VALUES (1, ?)`).run(
    JSON.stringify(bank),
  );
  const insert = db.prepare(
    `INSERT INTO quiz_questions (id, type, difficulty, block, payload_json) VALUES (?, ?, ?, ?, ?)`,
  );
  db.exec("BEGIN");
  for (const q of questions) {
    insert.run(q.id, q.type, q.difficulty ?? 1, q.block ?? null, JSON.stringify(q));
  }
  db.exec("COMMIT");
  return questions.length;
}

function seedDialogues(db) {
  if (!shouldSeed(db, "global_dialogue_sections")) {
    console.log(`[seed] global_dialogue_sections already has ${tableCount(db, "global_dialogue_sections")} rows — skip`);
    return tableCount(db, "global_dialogue_sections");
  }
  const main = readJson(join(WEB_ROOT, "src/data/global-dialogues.json"));
  const extra = readJson(join(WEB_ROOT, "src/data/global-dialogues-extra.json"));
  const sections = [...(main.sections ?? []), ...(extra.sections ?? [])];
  if (sections.length === 0) {
    console.warn("[seed] dialogue JSON empty — skipping global_dialogue_sections (DB preserved)");
    return 0;
  }
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
  if (!shouldSeed(db, "visual_pdf_entries")) {
    console.log(`[seed] visual_pdf_entries already has ${tableCount(db, "visual_pdf_entries")} rows — skip`);
    return tableCount(db, "visual_pdf_entries");
  }
  const raw = readJson(join(WEB_ROOT, "src/data/vocabulary-pdf-downloads.json"));
  const descriptions = readJson(
    join(WEB_ROOT, "src/data/vocabulary-pdf-descriptions.json"),
  );
  const pdfs = raw.pdfs ?? [];
  if (pdfs.length === 0) {
    console.warn(
      "[seed] vocabulary-pdf-downloads.json empty — skipping visual_pdf_entries (DB preserved)",
    );
    return 0;
  }
  db.exec("DELETE FROM visual_pdf_entries");
  const insert = db.prepare(
    `INSERT INTO visual_pdf_entries (id, file, sort_order, payload_json) VALUES (?, ?, ?, ?)`,
  );
  db.exec("BEGIN");
  pdfs.forEach((row, i) => {
    const d = descriptions[row.file];
    const merged = d
      ? { ...row, desc_pt: d.pt, desc_en: d.en, desc_es: d.es }
      : row;
    insert.run(row.id, row.file, i, JSON.stringify(merged));
  });
  db.exec("COMMIT");
  return pdfs.length;
}

function seedBooks(db) {
  if (!shouldSeed(db, "book_vocab_entries")) {
    console.log(`[seed] book_vocab_entries already has ${tableCount(db, "book_vocab_entries")} rows — skip`);
    return tableCount(db, "book_vocab_entries");
  }
  const curatedRoot = join(REPO_ROOT, "OrganizeVocabulary_books/curated");
  let lessonFiles = 0;
  for (const bookId of ["primary-up", "primary-down"]) {
    const dir = join(curatedRoot, bookId);
    if (!existsSync(dir)) continue;
    lessonFiles += readdirSync(dir).filter((f) => /^lesson-\d+\.json$/.test(f)).length;
  }
  if (lessonFiles === 0) {
    console.warn(
      `[seed] no lesson-*.json under ${curatedRoot} — skipping book_vocab_entries (DB preserved)`,
    );
    return 0;
  }
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

function seedContextDecks(db) {
  if (!shouldSeed(db, "context_decks")) {
    console.log(`[seed] context_decks already has ${tableCount(db, "context_decks")} rows — skip`);
    return { decks: tableCount(db, "context_decks"), cards: tableCount(db, "context_deck_cards") };
  }

  const indexPath = join(WEB_ROOT, "src/data/context-decks/index.json");
  if (!existsSync(indexPath)) {
    console.warn("[seed] context-decks/index.json missing — skip");
    return { decks: 0, cards: 0 };
  }
  const index = readJson(indexPath);
  const metas = index.decks ?? [];
  if (metas.length === 0) {
    console.warn("[seed] context-decks index empty — skip");
    return { decks: 0, cards: 0 };
  }

  db.exec("DELETE FROM context_deck_cards; DELETE FROM context_decks;");
  const insertDeck = db.prepare(
    `INSERT INTO context_decks (id, title, description, sort_order) VALUES (?, ?, ?, ?)`,
  );
  const insertCard = db.prepare(
    `INSERT INTO context_deck_cards
      (deck_id, sort_order, word, pinyin, meaning, section, pattern, pattern_label,
       sentence, sentence_pinyin, sentence_meaning, related, patterns, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  let cardCount = 0;
  db.exec("BEGIN");
  metas.forEach((meta, di) => {
    const deckPath = join(WEB_ROOT, "src/data/context-decks", `${meta.id}.json`);
    if (!existsSync(deckPath)) {
      console.warn(`[seed] missing deck file ${deckPath}`);
      return;
    }
    const deck = readJson(deckPath);
    insertDeck.run(meta.id, deck.title ?? meta.title, meta.description ?? "", di);
    (deck.cards ?? []).forEach((c, ci) => {
      insertCard.run(
        meta.id,
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
      cardCount++;
    });
  });
  db.exec("COMMIT");
  return { decks: metas.length, cards: cardCount };
}

/**
 * Unified practice/widget pool → lexico_entries.
 * Sources (no book): vocab_entries (blocks) + context_deck_cards + lexicon_global.
 * Only words with a rotation category enter the pool (widgets show categorized only).
 * Block map wins over assignments when both exist for the same hanzi.
 */
function seedLexico(db) {
  const rebuild =
    process.env.LEXICO_REBUILD === "1" || FORCE_RESEED;
  if (!rebuild && tableCount(db, "lexico_entries") > 0) {
    console.log(`[seed] lexico_entries already has ${tableCount(db, "lexico_entries")} rows — skip`);
    return {
      categories: tableCount(db, "lexico_rotation_categories"),
      entries: tableCount(db, "lexico_entries"),
    };
  }

  const blockToRotation = new Map();
  for (const rc of ROTATION_CATEGORIES) {
    for (const bid of rc.sourceBlockIds) blockToRotation.set(bid, rc.id);
  }

  const blocks = db.prepare(`SELECT id, title FROM content_blocks`).all();
  const titleByBlock = new Map(blocks.map((b) => [b.id, b.title]));

  /** @type {Map<string, object>} */
  const byHanzi = new Map();
  const pendingNoCategory = [];

  function consider(candidate) {
    const hanzi = (candidate.hanzi || "").trim();
    const pinyin = (candidate.pinyin || "").trim();
    const translation = (candidate.translation || "").trim();
    const hanziLength = [...hanzi].length;
    if (!hanzi || !pinyin || !translation) return;
    if (hanziLength > MAX_HANZI_LENGTH) return;

    const existing = byHanzi.get(hanzi);
    // Prefer editorial block over context/global for the same hanzi.
    if (existing && existing.priority <= candidate.priority) return;

    let rotationCategoryId = candidate.rotationCategoryId ?? null;
    if (!rotationCategoryId) {
      rotationCategoryId = LEXICO_CATEGORY_ASSIGNMENTS[hanzi] ?? null;
    }
    if (!rotationCategoryId) {
      // Already covered by a higher-priority source — not a real gap.
      if (existing) return;
      pendingNoCategory.push({
        hanzi,
        pinyin,
        translation,
        from: candidate.from,
      });
      return;
    }

    byHanzi.set(hanzi, {
      id: candidate.id,
      hanzi,
      pinyin,
      translation,
      hanziLength,
      sourceBlockId: candidate.sourceBlockId,
      sourceBlockTitle: candidate.sourceBlockTitle,
      rotationCategoryId,
      priority: candidate.priority,
    });
  }

  // 1) Editorial blocks (priority 0)
  for (const row of db
    .prepare(
      `SELECT block_id, hanzi, pinyin, translation
       FROM vocab_entries ORDER BY block_id ASC, sort_order ASC`,
    )
    .all()) {
    if (EXCLUDED_SOURCE_BLOCK_IDS.has(row.block_id)) continue;
    const rotationCategoryId = blockToRotation.get(row.block_id);
    if (!rotationCategoryId) continue;
    const hanzi = (row.hanzi || "").trim();
    consider({
      id: `${row.block_id}-${hanzi}`,
      hanzi,
      pinyin: row.pinyin,
      translation: row.translation,
      sourceBlockId: row.block_id,
      sourceBlockTitle: titleByBlock.get(row.block_id) ?? "",
      rotationCategoryId,
      priority: 0,
      from: `block:${row.block_id}`,
    });
  }

  // 2) Context decks (priority 1) — category from assignments only
  for (const row of db
    .prepare(
      `SELECT deck_id, word, pinyin, meaning
       FROM context_deck_cards ORDER BY deck_id ASC, sort_order ASC`,
    )
    .all()) {
    const hanzi = (row.word || "").trim();
    consider({
      id: `ctx-${row.deck_id}-${hanzi}`,
      hanzi,
      pinyin: row.pinyin,
      translation: row.meaning,
      sourceBlockId: 0,
      sourceBlockTitle: `context:${row.deck_id}`,
      rotationCategoryId: null,
      priority: 1,
      from: `context:${row.deck_id}`,
    });
  }

  // 3) Curator global lexicon (priority 2) — no book_vocab_*
  try {
    for (const row of db
      .prepare(
        `SELECT hanzi, pinyin, translation FROM lexicon_global ORDER BY hanzi ASC`,
      )
      .all()) {
      const hanzi = (row.hanzi || "").trim();
      consider({
        id: `global-${hanzi}`,
        hanzi,
        pinyin: row.pinyin,
        translation: row.translation,
        sourceBlockId: 0,
        sourceBlockTitle: "lexicon_global",
        rotationCategoryId: null,
        priority: 2,
        from: "lexicon_global",
      });
    }
  } catch {
    // Table may be absent on older DBs.
  }

  // 4) NTCSL level-2 core (≤3) — assignments only; not book_vocab_*
  const ntcslCorePath = join(
    REPO_ROOT,
    "OrganizeVocabulary_books",
    "level2_NTCSL",
    "lexico-core.json",
  );
  if (existsSync(ntcslCorePath)) {
    const ntcsl = readJson(ntcslCorePath);
    for (const row of ntcsl.entries ?? []) {
      const hanzi = (row.hanzi || "").trim();
      const assigned = LEXICO_CATEGORY_ASSIGNMENTS[hanzi] ?? row.category ?? null;
      consider({
        id: `ntcsl-l2-${hanzi}`,
        hanzi,
        pinyin: row.pinyin,
        translation: row.translation,
        sourceBlockId: 0,
        sourceBlockTitle: "ntcsl-l2-core",
        rotationCategoryId: assigned,
        priority: 2,
        from: "ntcsl-l2-core",
      });
    }
  }

  const entries = [...byHanzi.values()].sort(
    (a, b) =>
      a.rotationCategoryId.localeCompare(b.rotationCategoryId) ||
      a.sourceBlockId - b.sourceBlockId ||
      a.hanzi.localeCompare(b.hanzi, "zh"),
  );

  db.exec("DELETE FROM lexico_entries; DELETE FROM lexico_rotation_categories;");
  const insertCat = db.prepare(
    `INSERT INTO lexico_rotation_categories (id, title, source_block_ids, sort_order)
     VALUES (?, ?, ?, ?)`,
  );
  const insertEntry = db.prepare(
    `INSERT INTO lexico_entries
      (id, hanzi, pinyin, translation, hanzi_length, source_block_id,
       source_block_title, rotation_category_id, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  db.exec("BEGIN");
  ROTATION_CATEGORIES.forEach((c, i) => {
    insertCat.run(c.id, c.title, JSON.stringify(c.sourceBlockIds ?? []), i);
  });
  entries.forEach((e, i) => {
    insertEntry.run(
      e.id,
      e.hanzi,
      e.pinyin,
      e.translation,
      e.hanziLength,
      e.sourceBlockId,
      e.sourceBlockTitle,
      e.rotationCategoryId,
      i,
    );
  });
  db.exec("COMMIT");

  if (pendingNoCategory.length > 0) {
    console.warn(
      `[seed] lexico pending (no category, skipped for widgets): ${pendingNoCategory.length}`,
    );
    for (const p of pendingNoCategory.slice(0, 20)) {
      console.warn(`  - ${p.hanzi} (${p.from})`);
    }
    if (pendingNoCategory.length > 20) {
      console.warn(`  … +${pendingNoCategory.length - 20} more`);
    }
  }

  console.log(
    `[seed] lexico materialized (${entries.length} entries; blocks+context+global+ntcsl; no book)`,
  );
  return {
    categories: ROTATION_CATEGORIES.length,
    entries: entries.length,
    pendingNoCategory: pendingNoCategory.length,
  };
}

function main() {
  const path = dbPath();
  console.log(`Seeding content DB: ${path}${FORCE_RESEED ? " (FORCE_RESEED=1)" : " (fill empty only)"}`);
  const db = openDb();
  const counts = {
    blocks: seedEditorial(db),
    phrases: seedPhrases(db),
    quizQuestions: seedQuiz(db),
    dialogueSections: seedDialogues(db),
    visualPdfs: seedVisuals(db),
    bookVocab: seedBooks(db),
    contextDecks: seedContextDecks(db),
    lexico: seedLexico(db),
  };
  db.close();
  console.log("Seed complete:", counts);
}

main();
