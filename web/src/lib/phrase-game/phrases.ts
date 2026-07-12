/**
 * Typed phrase bank loader (server-only). Pass results into client as props.
 */
import { getDb } from "@/server/db";
import { contentSource } from "@/lib/content/content-repository";
import type { Phrase } from "./types";

type PhraseBank = {
  version: number;
  count: number;
  phrases: Phrase[];
};

function loadFromJson(): Phrase[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const data = require("@/data/phrase-game/phrases.json") as PhraseBank;
  return data.phrases;
}

function loadFromDb(): Phrase[] {
  const rows = getDb()
    .prepare(`SELECT payload_json FROM phrase_game_phrases ORDER BY id`)
    .all() as { payload_json: string }[];
  return rows.map((r) => JSON.parse(String(r.payload_json)) as Phrase);
}

/** Phrase bank: SQLite when CONTENT_SOURCE=db (no JSON fallback). */
export function getAllPhrases(): Phrase[] {
  if (contentSource() === "json") return loadFromJson();
  try {
    return loadFromDb();
  } catch (err) {
    console.warn("[phrases] DB read failed — run npm run seed:content", err);
    return [];
  }
}
