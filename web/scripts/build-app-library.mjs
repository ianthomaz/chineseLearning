#!/usr/bin/env node
/**
 * Build app library snapshot from SQLite → web/data/app-library/{library,meta}.json
 *
 * contentVersion bumps only when the content fingerprint changes.
 *
 * Usage (from web/):
 *   npm run build:app-library
 *   SITE_DB=/path/to/db.sqlite npm run build:app-library
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = resolve(__dirname, "..");
const SCHEMA_VERSION = 1;

function dbPath() {
  return (
    process.env.SITE_DB ??
    process.env.PHRASE_GAME_DB ??
    join(WEB_ROOT, "data", "phrase-game.sqlite")
  );
}

function outDir() {
  return join(WEB_ROOT, "data", "app-library");
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
}

function sha256Hex(data) {
  return createHash("sha256").update(data).digest("hex");
}

function mapCard(row) {
  const card = {
    word: row.word,
    pinyin: row.pinyin,
    meaning: row.meaning,
  };
  if (row.section) card.section = row.section;
  if (row.pattern) card.pattern = row.pattern;
  if (row.pattern_label) card.patternLabel = row.pattern_label;
  if (row.sentence) card.sentence = row.sentence;
  if (row.sentence_pinyin) card.sentencePinyin = row.sentence_pinyin;
  if (row.sentence_meaning) card.sentenceMeaning = row.sentence_meaning;
  if (row.related) card.related = row.related;
  if (row.patterns) card.patterns = row.patterns;
  if (row.notes) card.notes = row.notes;
  return card;
}

function loadSections(db) {
  const cats = db
    .prepare(
      `SELECT id, title, sort_order FROM lexico_rotation_categories ORDER BY sort_order ASC, id ASC`,
    )
    .all();
  const catTitle = new Map(cats.map((c) => [c.id, c.title]));

  const entryRows = db
    .prepare(
      `SELECT id, hanzi, pinyin, translation, hanzi_length, rotation_category_id, sort_order
       FROM lexico_entries ORDER BY sort_order ASC, id ASC`,
    )
    .all();

  const entries = entryRows.map((e) => ({
    id: e.id,
    hanzi: e.hanzi,
    pinyin: e.pinyin,
    translation: e.translation,
    hanziLength: e.hanzi_length,
    rotationCategoryId: e.rotation_category_id,
    rotationCategoryTitle: catTitle.get(e.rotation_category_id) ?? "",
  }));

  const decks = db
    .prepare(
      `SELECT id, title, description, sort_order FROM context_decks ORDER BY sort_order ASC, id ASC`,
    )
    .all();

  const cards = db
    .prepare(
      `SELECT deck_id, sort_order, word, pinyin, meaning, section, pattern, pattern_label,
              sentence, sentence_pinyin, sentence_meaning, related, patterns, notes
       FROM context_deck_cards ORDER BY deck_id ASC, sort_order ASC`,
    )
    .all();

  const cardsByDeck = new Map();
  for (const c of cards) {
    const list = cardsByDeck.get(c.deck_id) ?? [];
    list.push(mapCard(c));
    cardsByDeck.set(c.deck_id, list);
  }

  return {
    rotationCategories: cats.map((c) => ({ id: c.id, title: c.title })),
    entries,
    contextDecks: decks.map((d) => ({
      id: d.id,
      title: d.title,
      ...(d.description ? { description: d.description } : {}),
      cards: cardsByDeck.get(d.id) ?? [],
    })),
  };
}

function readPreviousMeta() {
  const p = join(outDir(), "meta.json");
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function main() {
  const path = dbPath();
  if (!existsSync(path)) {
    console.error(`[build:app-library] DB missing: ${path} — run npm run seed:content first`);
    process.exit(1);
  }

  const db = new DatabaseSync(path);
  const sections = loadSections(db);
  db.close();

  if (sections.entries.length === 0) {
    console.warn("[build:app-library] lexico_entries empty — snapshot will have 0 entries");
  }

  // App bundled lexico.json uses meta.version === 1 (no contextDecks).
  // First remote library must be > that floor or seedIfNeeded no-ops.
  const BUNDLED_SEED_FLOOR = 1;

  const fingerprint = sha256Hex(stableStringify(sections));
  const prev = readPreviousMeta();
  let contentVersion = BUNDLED_SEED_FLOOR + 1;
  if (prev?.contentFingerprint === fingerprint && typeof prev.contentVersion === "number") {
    contentVersion = Math.max(prev.contentVersion, BUNDLED_SEED_FLOOR + 1);
  } else if (typeof prev?.contentVersion === "number") {
    contentVersion = Math.max(prev.contentVersion + 1, BUNDLED_SEED_FLOOR + 1);
  }

  const generatedAt = new Date().toISOString();
  const pack = {
    meta: {
      schemaVersion: SCHEMA_VERSION,
      contentVersion,
      // Alias for older docs / readers that still look at meta.version
      version: contentVersion,
      source: "chineseLearning",
      generatedAt,
    },
    ...sections,
  };

  const body = `${JSON.stringify(pack)}\n`;
  const bytes = Buffer.from(body, "utf8");
  const sha256 = sha256Hex(bytes);

  const dir = outDir();
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "library.json"), bytes);
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "/aulaChines").replace(
    /\/$/,
    "",
  );
  const packUrl = `${basePath}/api/app/content/pack/library`;
  const meta = {
    schemaVersion: SCHEMA_VERSION,
    contentVersion,
    generatedAt,
    byteSize: bytes.byteLength,
    sha256,
    packUrl,
    contentFingerprint: fingerprint,
  };
  writeFileSync(join(dir, "meta.json"), `${JSON.stringify(meta, null, 2)}\n`);

  console.log("[build:app-library] OK", {
    contentVersion,
    entries: sections.entries.length,
    decks: sections.contextDecks.length,
    byteSize: meta.byteSize,
    packUrl,
    sha256: sha256.slice(0, 12) + "…",
    bumped: !prev || prev.contentFingerprint !== fingerprint,
  });
}

main();
