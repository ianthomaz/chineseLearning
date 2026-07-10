/**
 * Server-side content accessors. Client components must receive data via props
 * and import types from `@/lib/blocks-types` only.
 */
import { getContentRepository } from "@/lib/content";
import type { BlockSummary, ContentBlock } from "@/lib/blocks-types";

export type {
  BlockSummary,
  ContentBlock,
  DialogueTurn,
  StructureGlossesByLocale,
  StructureLine,
  VocabRow,
} from "@/lib/blocks-types";
export { blockHasGrammarContent } from "@/lib/blocks-types";

export function getBlocks(): ContentBlock[] {
  return getContentRepository().getBlocks();
}

export function getBlock(id: string | number): ContentBlock | undefined {
  return getContentRepository().getBlock(id);
}

export function getBlockIds(): string[] {
  return getContentRepository().getBlockIds();
}

export function getBlockSummaries(): BlockSummary[] {
  return getBlocks().map((b) => ({ id: b.id, title: b.title }));
}
