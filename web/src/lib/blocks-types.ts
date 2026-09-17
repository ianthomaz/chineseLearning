import type { LocalizedLine } from "@/lib/localized-line";

export type VocabRow = {
  hanzi: string;
  pinyin: string;
  translation: string;
};

export type StructureLine = {
  hanzi: string;
  pinyin: string;
};

export type DialogueTurn = {
  speaker: string;
  hanzi: string;
  pinyin: string;
  translation: LocalizedLine;
};

export type StructureGlossesByLocale = {
  pt: string[];
  en: string[];
  es: string[];
};

export type ContentBlock = {
  id: number;
  title: string;
  narrative: string;
  structures: StructureLine[];
  structureGlosses: StructureGlossesByLocale;
  reviewStandalonePhrases: StructureGlossesByLocale;
  reviewMiniDialogues: DialogueTurn[][];
  notes: string[];
  differences: string[];
  priorities: string[];
  vocabulary: VocabRow[];
};

export type BlockSummary = {
  id: number;
  title: string;
};

/**
 * Everything the block index cards render — id, title and the per-mode counts.
 * Index pages send this instead of the full {@link ContentBlock}, which keeps the
 * whole course content (~90 kB) out of the client payload.
 */
export type BlockIndexEntry = {
  id: number;
  title: string;
  /** Structure lines — the "phrases" count on the review index. */
  structureCount: number;
  vocabCount: number;
  /** Structures + notes + differences — the "rules" count on the grammar index. */
  grammarCount: number;
};

export function toBlockIndexEntry(b: ContentBlock): BlockIndexEntry {
  return {
    id: b.id,
    title: b.title,
    structureCount: b.structures.length,
    vocabCount: b.vocabulary.length,
    grammarCount: b.structures.length + b.notes.length + b.differences.length,
  };
}

export function blockHasGrammarContent(b: ContentBlock): boolean {
  return (
    b.structures.length +
      b.notes.length +
      b.differences.length +
      b.priorities.length >
    0
  );
}
