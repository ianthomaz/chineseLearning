/**
 * Build app-library pack from editorial SQLite (lexico_* + context_decks).
 * Used by the CLI job and by API fallback.
 */
import { createHash } from "node:crypto";
import type {
  AppLibraryContextCard,
  AppLibraryPack,
  AppLibraryRotationCategory,
  AppLibraryEntry,
} from "./types";
import { APP_LIBRARY_SCHEMA_VERSION } from "./types";

export type LibrarySqlClient = {
  prepare: (sql: string) => {
    all: (...params: unknown[]) => unknown[];
    get: (...params: unknown[]) => unknown;
  };
};

type CatRow = {
  id: string;
  title: string;
  sort_order: number;
};

type EntryRow = {
  id: string;
  hanzi: string;
  pinyin: string;
  translation: string;
  hanzi_length: number;
  rotation_category_id: string;
  sort_order: number;
};

type DeckRow = {
  id: string;
  title: string;
  description: string;
  sort_order: number;
};

type CardRow = {
  deck_id: string;
  sort_order: number;
  word: string;
  pinyin: string;
  meaning: string;
  section: string | null;
  pattern: string | null;
  pattern_label: string | null;
  sentence: string | null;
  sentence_pinyin: string | null;
  sentence_meaning: string | null;
  related: string | null;
  patterns: string | null;
  notes: string | null;
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

export function sha256Hex(data: string | Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

export function contentFingerprint(sections: {
  rotationCategories: AppLibraryRotationCategory[];
  entries: AppLibraryEntry[];
  contextDecks: AppLibraryPack["contextDecks"];
}): string {
  return sha256Hex(stableStringify(sections));
}

function mapCard(row: CardRow): AppLibraryContextCard {
  const card: AppLibraryContextCard = {
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

/** Load sections from an open node:sqlite DatabaseSync (or compatible). */
export function loadLibrarySections(db: LibrarySqlClient): {
  rotationCategories: AppLibraryRotationCategory[];
  entries: AppLibraryEntry[];
  contextDecks: AppLibraryPack["contextDecks"];
} {
  const cats = db
    .prepare(
      `SELECT id, title, sort_order FROM lexico_rotation_categories ORDER BY sort_order ASC, id ASC`,
    )
    .all() as CatRow[];

  const catTitle = new Map(cats.map((c) => [c.id, c.title]));

  const entryRows = db
    .prepare(
      `SELECT id, hanzi, pinyin, translation, hanzi_length, rotation_category_id, sort_order
       FROM lexico_entries ORDER BY sort_order ASC, id ASC`,
    )
    .all() as EntryRow[];

  const entries: AppLibraryEntry[] = entryRows.map((e) => ({
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
    .all() as DeckRow[];

  const cards = db
    .prepare(
      `SELECT deck_id, sort_order, word, pinyin, meaning, section, pattern, pattern_label,
              sentence, sentence_pinyin, sentence_meaning, related, patterns, notes
       FROM context_deck_cards ORDER BY deck_id ASC, sort_order ASC`,
    )
    .all() as CardRow[];

  const cardsByDeck = new Map<string, AppLibraryContextCard[]>();
  for (const c of cards) {
    const list = cardsByDeck.get(c.deck_id) ?? [];
    list.push(mapCard(c));
    cardsByDeck.set(c.deck_id, list);
  }

  const contextDecks = decks.map((d) => ({
    id: d.id,
    title: d.title,
    description: d.description || undefined,
    cards: cardsByDeck.get(d.id) ?? [],
  }));

  return {
    rotationCategories: cats.map((c) => ({ id: c.id, title: c.title })),
    entries,
    contextDecks,
  };
}

export function assemblePack(
  sections: ReturnType<typeof loadLibrarySections>,
  contentVersion: number,
  generatedAt: string = new Date().toISOString(),
): AppLibraryPack {
  return {
    meta: {
      schemaVersion: APP_LIBRARY_SCHEMA_VERSION,
      contentVersion,
      version: contentVersion,
      source: "chineseLearning",
      generatedAt,
    },
    rotationCategories: sections.rotationCategories,
    entries: sections.entries,
    contextDecks: sections.contextDecks,
  };
}
