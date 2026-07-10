import type { ContentBlock } from "@/lib/blocks-types";

export type ContentSource = "json" | "db";

export interface ContentRepository {
  getBlocks(): ContentBlock[];
  getBlock(id: string | number): ContentBlock | undefined;
  getBlockIds(): string[];
}

export function contentSource(): ContentSource {
  // Static export cannot open SQLite — always use JSON artifacts.
  if (process.env.NEXT_STATIC_EXPORT === "1") return "json";
  const raw = process.env.CONTENT_SOURCE?.toLowerCase();
  if (raw === "json") return "json";
  return "db";
}
