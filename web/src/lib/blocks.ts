import data from "@/data/consolidado.json";

export type VocabRow = {
  hanzi: string;
  pinyin: string;
  translation: string;
};

export type ContentBlock = {
  id: number;
  title: string;
  narrative: string;
  structures: string[];
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
