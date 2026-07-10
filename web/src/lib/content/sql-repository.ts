/**
 * SQLite-backed ContentRepository (server-only).
 * Reads ContentBlock from content_blocks.payload_json (seeded from consolidado.json).
 * Falls back to JSON when the editorial tables are empty (unseeded DB).
 */
import { getDb } from "@/server/db";
import type { ContentBlock } from "@/lib/blocks-types";
import type { ContentRepository } from "./content-repository";
import { jsonContentRepository } from "./json-repository";

function loadBlocksFromDb(): ContentBlock[] {
  const rows = getDb()
    .prepare(
      `SELECT payload_json FROM content_blocks ORDER BY sort_order ASC, id ASC`,
    )
    .all() as { payload_json: string }[];
  return rows.map((r) => JSON.parse(r.payload_json) as ContentBlock);
}

let cache: ContentBlock[] | null = null;

function blocks(): ContentBlock[] {
  if (cache) return cache;
  const fromDb = loadBlocksFromDb();
  if (fromDb.length === 0) {
    console.warn(
      "[content] content_blocks empty — falling back to consolidado.json (run npm run seed:content)",
    );
    cache = jsonContentRepository.getBlocks();
  } else {
    cache = fromDb;
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
