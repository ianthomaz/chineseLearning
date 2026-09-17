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

/** Bumped whenever {@link toRuntimePhrase} changes shape, so clients refetch. */
export const PHRASE_BANK_VERSION = 2;

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

let cache: Phrase[] | null = null;

/**
 * Phrase bank: SQLite when CONTENT_SOURCE=db (no JSON fallback).
 *
 * Memoised per process — the bank is a build artifact, and re-reading + parsing
 * 616 rows on every request showed up on the backoffice and the bank API.
 */
export function getAllPhrases(): Phrase[] {
  if (cache) return cache;
  if (contentSource() === "json") {
    cache = loadFromJson();
    return cache;
  }
  try {
    cache = loadFromDb();
  } catch (err) {
    console.warn("[phrases] DB read failed — run npm run seed:content", err);
    return [];
  }
  return cache;
}

/**
 * Drop the fields the game never reads at play time (`nivel` and `tags` are
 * authoring metadata; round selection keys off `tier` and token count). Worth
 * ~10% of the bank, and it keeps the wire shape honest about what the UI uses.
 */
function toRuntimePhrase(p: Phrase): Phrase {
  const runtime: Phrase = { ...p };
  delete runtime.nivel;
  delete runtime.tags;
  return runtime;
}

/** The bank as the client receives it — see {@link toRuntimePhrase}. */
export function getRuntimePhrases(): Phrase[] {
  return getAllPhrases().map(toRuntimePhrase);
}
