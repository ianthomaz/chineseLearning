import type { ContentBlock } from "@/lib/blocks";

export type ContentSource = "json" | "db";

export interface ContentRepository {
  getBlocks(): ContentBlock[];
  getBlock(id: string | number): ContentBlock | undefined;
  getBlockIds(): string[];
}

export function contentSource(): ContentSource {
  const raw = process.env.CONTENT_SOURCE?.toLowerCase();
  if (raw === "db") return "db";
  return "json";
}
