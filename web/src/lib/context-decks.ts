/**
 * Context flashcard deck types + client-safe helpers.
 * Data lives in SQLite (`context_decks` / `context_deck_cards`).
 * Server loads via `@/server/db/context-decks`.
 */

export type ContextDeckCard = {
  word: string;
  pinyin: string;
  meaning: string;
  section?: string;
  pattern?: string;
  patternLabel?: string;
  sentence?: string;
  sentencePinyin?: string;
  sentenceMeaning?: string;
  related?: string;
  patterns?: string;
  notes?: string;
};

export type ContextDeck = {
  id: string;
  title: string;
  cards: ContextDeckCard[];
};

export type ContextDeckMeta = {
  id: string;
  title: string;
  description: string;
  cardCount: number;
};

export function metaFromDecks(decks: ContextDeck[], descriptions: Record<string, string> = {}): ContextDeckMeta[] {
  return decks.map((d) => ({
    id: d.id,
    title: d.title,
    description: descriptions[d.id] ?? "",
    cardCount: d.cards.length,
  }));
}

export function findContextDeck(decks: ContextDeck[], id: string): ContextDeck | null {
  return decks.find((d) => d.id === id) ?? null;
}
