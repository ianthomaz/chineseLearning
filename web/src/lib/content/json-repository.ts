import data from "@/data/consolidado.json";
import type { ContentBlock } from "@/lib/blocks-types";
import type { ContentRepository } from "./content-repository";

const blocks = data.blocks as ContentBlock[];

export const jsonContentRepository: ContentRepository = {
  getBlocks() {
    return blocks;
  },
  getBlock(id: string | number) {
    const n = typeof id === "string" ? Number.parseInt(id, 10) : id;
    if (Number.isNaN(n)) return undefined;
    return blocks.find((b) => b.id === n);
  },
  getBlockIds() {
    return blocks.map((b) => String(b.id));
  },
};
