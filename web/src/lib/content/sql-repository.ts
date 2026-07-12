/**
 * SQLite-backed ContentRepository (server-only).
 * Reads ContentBlock from content_blocks.payload_json (seeded from consolidado.json).
 * In CONTENT_SOURCE=db mode there is no JSON fallback — empty means unseeded.
 */
import { getDb } from "@/server/db";
import type { ContentBlock } from "@/lib/blocks-types";
import type { ContentRepository } from "./content-repository";

function loadBlocksFromDb(): ContentBlock[] {
  const rows = getDb()
    .prepare(
      `SELECT payload_json FROM content_blocks ORDER BY sort_order ASC, id ASC`,
    )
    .all() as { payload_json: string }[];
  return rows.map((r) => JSON.parse(String(r.payload_json)) as ContentBlock);
}

let cache: ContentBlock[] | null = null;

function blocks(): ContentBlock[] {
  if (cache) return cache;
  cache = loadBlocksFromDb();
  if (cache.length === 0) {
    console.warn("[content] content_blocks empty — run npm run seed:content");
  }
  return cache;
}

export const sqlContentRepository: ContentRepository = {
  getBlocks() {
    return blocks();
  },
  getBlock(id: string | number) {
    const n = typeof id === "string" ? Number.parseInt(id, 10) : id;
    if (Number.isNaN(n)) return undefined;
    return blocks().find((b) => b.id === n);
  },
  getBlockIds() {
    return blocks().map((b) => String(b.id));
  },
};
