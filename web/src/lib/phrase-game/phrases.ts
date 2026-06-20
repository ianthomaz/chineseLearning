/**
 * Typed loader for the validated phrase bank.
 *
 * The JSON is produced at build time by `scripts/build-phrase-game-data.mjs`
 * (run via the `prebuild:phrase-game` npm step) from `FRASES_GAME/curated/phrases.json`.
 */

import data from "@/data/phrase-game/phrases.json";
import type { Phrase } from "./types";

type PhraseBank = {
  version: number;
  count: number;
  phrases: Phrase[];
};

const bank = data as PhraseBank;

export const ALL_PHRASES: Phrase[] = bank.phrases;

export function phraseCount(): number {
  return bank.phrases.length;
}
