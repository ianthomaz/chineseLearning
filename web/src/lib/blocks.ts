import data from "@/data/consolidado.json";
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
  /** Per-locale gloss for each structure line (from review_extras) */
  structureGlosses: StructureGlossesByLocale;
  /** Extra phrase lists when the block has no central structures (e.g. bloco 15 + review_extras) */
  reviewStandalonePhrases: StructureGlossesByLocale;
  /** Block-level mini-dialogues shown after all phrases in review mode */
  reviewMiniDialogues: DialogueTurn[][];
  notes: string[];
  differences: string[];
  priorities: string[];
  vocabulary: VocabRow[];
};

export const blocks: ContentBlock[] = data.blocks as ContentBlock[];

export function getBlock(id: string | number): ContentBlock | undefined {
  const n = typeof id === "string" ? Number.parseInt(id, 10) : id;
  if (Number.isNaN(n)) return undefined;
  return blocks.find((b) => b.id === n);
}

export function getBlockIds(): string[] {
  return blocks.map((b) => String(b.id));
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
