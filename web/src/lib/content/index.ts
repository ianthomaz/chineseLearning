import type { ContentRepository } from "./content-repository";
import { contentSource } from "./content-repository";
import { jsonContentRepository } from "./json-repository";
import { sqlContentRepository } from "./sql-repository";

let cached: ContentRepository | null = null;

/**
 * Active content backend. Default is `db` (SQLite). Set CONTENT_SOURCE=json
 * only for static export / explicit JSON mode — db mode never falls back to JSON.
 *
 * Server-only: do not import from Client Components. Pass data via props.
 */
export function getContentRepository(): ContentRepository {
  if (cached) return cached;
  cached = contentSource() === "db" ? sqlContentRepository : jsonContentRepository;
  return cached;
}

export { contentSource } from "./content-repository";
export type { ContentRepository, ContentSource } from "./content-repository";
