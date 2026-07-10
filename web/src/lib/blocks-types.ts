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

export function blockHasGrammarContent(b: ContentBlock): boolean {
  return (
    b.structures.length +
      b.notes.length +
      b.differences.length +
      b.priorities.length >
    0
  );
}
