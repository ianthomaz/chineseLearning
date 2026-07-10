/**
 * Eixo A — book chapter lexicon (server-only).
 */
import { getDb } from "./index";

export type BookVocabHit = {
  bookId: string;
  lesson: number;
  source: "text" | "extension" | "produce";
  hanzi: string;
  pinyin: string | null;
  pos: string | null;
  glossEn: string | null;
};

export function lookupBookVocabByHanzi(hanzi: string, limit = 8): BookVocabHit[] {
  const trimmed = hanzi.trim();
  if (!trimmed) return [];
  const rows = getDb()
    .prepare(
      `SELECT book_id, lesson, source, hanzi, pinyin, pos, gloss_en
       FROM book_vocab_entries
       WHERE hanzi = ?
       ORDER BY book_id, lesson, sort_order
       LIMIT ?`,
    )
    .all(trimmed, limit) as {
    book_id: string;
    lesson: number;
    source: BookVocabHit["source"];
    hanzi: string;
    pinyin: string | null;
    pos: string | null;
    gloss_en: string | null;
  }[];

  return rows.map((r) => ({
    bookId: r.book_id,
    lesson: r.lesson,
    source: r.source,
    hanzi: r.hanzi,
    pinyin: r.pinyin,
    pos: r.pos,
    glossEn: r.gloss_en,
  }));
}

/** Best single suggestion for form autofill (prefers text/extension over produce). */
export function suggestBookVocab(hanzi: string): BookVocabHit | null {
  const hits = lookupBookVocabByHanzi(hanzi, 20);
  if (hits.length === 0) return null;
  const preferred =
    hits.find((h) => h.source === "text") ??
    hits.find((h) => h.source === "extension") ??
    hits[0];
  return preferred;
}
