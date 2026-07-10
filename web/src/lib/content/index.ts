import type { ContentRepository } from "./content-repository";
import { contentSource } from "./content-repository";
import { jsonContentRepository } from "./json-repository";

let cached: ContentRepository | null = null;

/**
 * Returns the active content backend. Today only `json` is implemented;
 * `CONTENT_SOURCE=db` will be wired when editorial content moves to SQLite.
 */
export function getContentRepository(): ContentRepository {
  if (cached) return cached;
  const source = contentSource();
  if (source === "db") {
    throw new Error(
      "CONTENT_SOURCE=db is not implemented yet — use json or omit CONTENT_SOURCE",
    );
  }
  cached = jsonContentRepository;
  return cached;
}
