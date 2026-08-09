/**
 * Lexico pending candidates — words in project sources that are not yet in
 * lexico_entries (no rotation category → widgets skip them).
 *
 * Sources: context_deck_cards + lexicon_global. Never book_vocab_*.
 * Editorial blocks already map via lexico-rotation-config (seed).
 */

/** Keep in sync with web/scripts/lexico-rotation-config.mjs */
export const MAX_HANZI_LENGTH = 3;

export type LexicoPendingCandidate = {
  hanzi: string;
  pinyin: string;
  translation: string;
  from: string;
  hanziLength: number;
};

type SqlLike = {
  prepare: (sql: string) => {
    all: (...params: unknown[]) => Record<string, unknown>[];
  };
};

function hanziLen(hanzi: string): number {
  return [...hanzi].length;
}

/**
 * Diff project sources vs lexico_entries. Pure SQL helper for scripts + future API.
 */
export function listLexicoPending(db: SqlLike): LexicoPendingCandidate[] {
  const inLexico = new Set(
    db
      .prepare(`SELECT hanzi FROM lexico_entries`)
      .all()
      .map((r) => String(r.hanzi)),
  );

  const byHanzi = new Map<string, LexicoPendingCandidate>();

  const push = (
    hanziRaw: unknown,
    pinyinRaw: unknown,
    translationRaw: unknown,
    from: string,
  ) => {
    const hanzi = String(hanziRaw ?? "").trim();
    const pinyin = String(pinyinRaw ?? "").trim();
    const translation = String(translationRaw ?? "").trim();
    const len = hanziLen(hanzi);
    if (!hanzi || !pinyin || !translation) return;
    if (len > MAX_HANZI_LENGTH) return;
    if (inLexico.has(hanzi)) return;
    if (byHanzi.has(hanzi)) return;
    byHanzi.set(hanzi, {
      hanzi,
      pinyin,
      translation,
      from,
      hanziLength: len,
    });
  };

  for (const row of db
    .prepare(
      `SELECT deck_id, word, pinyin, meaning FROM context_deck_cards`,
    )
    .all()) {
    push(row.word, row.pinyin, row.meaning, `context:${row.deck_id}`);
  }

  try {
    for (const row of db
      .prepare(`SELECT hanzi, pinyin, translation FROM lexicon_global`)
      .all()) {
      push(row.hanzi, row.pinyin, row.translation, "lexicon_global");
    }
  } catch {
    // optional table
  }

  return [...byHanzi.values()].sort((a, b) =>
    a.hanzi.localeCompare(b.hanzi, "zh"),
  );
}
