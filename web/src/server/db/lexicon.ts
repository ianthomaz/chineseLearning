/**
 * Site-wide accumulated lexicon (server-only). Keyed by the EXACT hanzi
 * string. Upserted whenever a lesson is saved; entries are never deleted
 * automatically when a word leaves a lesson (docs/12 §6).
 */
import { getDb } from "./index";

export type LexiconEntryInput = {
  hanzi: string;
  pinyin?: string | null;
  translation?: string | null;
  theme?: string | null;
};

/**
 * Insert or refresh one lexicon entry. Empty/null incoming fields never
 * overwrite existing values. `seen_count` only increments when `bumpSeen`
 * (lesson create, not edit — re-saving must not inflate the count).
 */
export function upsertLexiconEntry(
  entry: LexiconEntryInput,
  lessonId: number,
  bumpSeen: boolean,
): void {
  getDb()
    .prepare(
      `INSERT INTO lexicon_global (hanzi, pinyin, translation, theme, first_seen_lesson_id)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(hanzi) DO UPDATE SET
         pinyin      = COALESCE(NULLIF(excluded.pinyin, ''),      lexicon_global.pinyin),
         translation = COALESCE(NULLIF(excluded.translation, ''), lexicon_global.translation),
         theme       = COALESCE(NULLIF(excluded.theme, ''),       lexicon_global.theme),
         seen_count  = lexicon_global.seen_count + ?,
         updated_at  = datetime('now')`,
    )
    .run(
      entry.hanzi,
      entry.pinyin ?? null,
      entry.translation ?? null,
      entry.theme ?? null,
      lessonId,
      bumpSeen ? 1 : 0,
    );
}
