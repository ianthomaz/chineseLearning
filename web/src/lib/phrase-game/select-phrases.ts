/**
 * Round building: filter the phrase pool by tier + level, then sample 10 phrases
 * and decide each one's distractor budget per the level rules (global max 2).
 *
 * Length bands (token count): short ≤3, medium 4–5, long ≥6.
 * Game levels 3–5 use weighted mixing — mostly longer phrases, but short ones
 * can still appear (e.g. one L1 phrase in a level-5 round).
 */

import { shuffle } from "./random";
import {
  type DisplaySettings,
  type GameLevel,
  type GameTier,
  type Phrase,
  type RoundConfig,
  type RoundItem,
  ROUND_SIZE,
} from "./types";

/** Tier filter: Iniciante = HSK1-only; Básico = full bank (HSK1 + extended basic). */
export function tierFilter(phrases: Phrase[], tier: GameTier): Phrase[] {
  if (tier === "iniciante") return phrases.filter((p) => p.tier === "hsk1");
  return phrases;
}

type LengthBand = "short" | "medium" | "long";

export function lengthBand(phrase: Phrase): LengthBand {
  const n = phrase.tokens.length;
  if (n <= 3) return "short";
  if (n <= 5) return "medium";
  return "long";
}

/** Per-slot probability weights when building a round (must sum to 1). */
const ROUND_MIX_WEIGHTS: Record<GameLevel, Record<LengthBand, number>> = {
  1: { short: 1, medium: 0, long: 0 },
  2: { short: 0.25, medium: 0.75, long: 0 },
  3: { short: 0.15, medium: 0.45, long: 0.4 },
  4: { short: 0.12, medium: 0.33, long: 0.55 },
  5: { short: 0.1, medium: 0.25, long: 0.65 },
};

function partitionByBand(phrases: Phrase[]): Record<LengthBand, Phrase[]> {
  const bands: Record<LengthBand, Phrase[]> = { short: [], medium: [], long: [] };
  for (const p of phrases) bands[lengthBand(p)].push(p);
  return bands;
}

/** Legacy strict band (primary pool for a level). Kept for tests / docs. */
export function levelBand(phrases: Phrase[], level: GameLevel): Phrase[] {
  const count = (p: Phrase) => p.tokens.length;
  let band: Phrase[];
  if (level === 1) band = phrases.filter((p) => count(p) <= 3);
  else if (level === 2) band = phrases.filter((p) => count(p) <= 5);
  else band = phrases.filter((p) => count(p) >= 4);
  return band.length > 0 ? band : phrases;
}

function pickWeightedBand(
  weights: Record<LengthBand, number>,
  bands: Record<LengthBand, Phrase[]>,
  isAvailable: (p: Phrase) => boolean,
): LengthBand | null {
  const eligible: Array<{ band: LengthBand; w: number }> = [];
  for (const band of ["short", "medium", "long"] as const) {
    if (weights[band] <= 0) continue;
    if (bands[band].some(isAvailable)) eligible.push({ band, w: weights[band] });
  }
  if (eligible.length === 0) return null;
  const total = eligible.reduce((s, e) => s + e.w, 0);
  let roll = Math.random() * total;
  for (const e of eligible) {
    roll -= e.w;
    if (roll <= 0) return e.band;
  }
  return eligible[eligible.length - 1].band;
}

/**
 * Sample n phrases with band weights; prefer unique ids, allow repeats only if needed.
 */
function weightedSample(
  phrases: Phrase[],
  level: GameLevel,
  n: number,
): { items: Phrase[]; usedReplacement: boolean } {
  if (phrases.length === 0) return { items: [], usedReplacement: false };

  const weights = ROUND_MIX_WEIGHTS[level];
  const bands = partitionByBand(phrases);
  const picked: Phrase[] = [];
  const usedIds = new Set<string>();
  let usedReplacement = false;

  const isAvailable = (p: Phrase) => !usedIds.has(p.id);

  for (let i = 0; i < n; i++) {
    const bandKey = pickWeightedBand(weights, bands, isAvailable);
    let pool: Phrase[];

    if (bandKey) {
      pool = bands[bandKey].filter(isAvailable);
    } else {
      pool = phrases.filter(isAvailable);
    }

    if (pool.length === 0) {
      usedReplacement = true;
      picked.push(phrases[Math.floor(Math.random() * phrases.length)]);
      continue;
    }

    const choice = pool[Math.floor(Math.random() * pool.length)];
    picked.push(choice);
    usedIds.add(choice.id);
  }

  return { items: shuffle(picked), usedReplacement };
}

/** Distractor budget for a phrase, clamped to [0, 2]. */
function distractorBudget(
  level: GameLevel,
  settings: DisplaySettings,
  chosenForLevel4Extra: boolean,
): number {
  let levelBase = 0;
  if (level === 4) levelBase = chosenForLevel4Extra ? 1 : 0;
  else if (level === 5) levelBase = 1 + (Math.random() < 0.5 ? 1 : 0); // 1 or 2
  const checkboxExtra = settings.addExtraHanzi ? 2 : 0;
  return Math.max(0, Math.min(2, Math.max(levelBase, checkboxExtra)));
}

export type Round = {
  items: RoundItem[];
  /** True when the filtered pool was smaller than the round size. */
  usedReplacement: boolean;
};

/**
 * Build a full round of {@link ROUND_SIZE} phrases for the given configuration.
 */
export function buildRound(phrases: Phrase[], config: RoundConfig): Round {
  const level: GameLevel =
    config.tier === "iniciante" && config.level > 2 ? 2 : config.level;

  const tiered = tierFilter(phrases, config.tier);
  const { items: sampled, usedReplacement } = weightedSample(tiered, level, ROUND_SIZE);

  if (usedReplacement && process.env.NODE_ENV !== "production") {
    console.warn(
      `[phrase-game] tier=${config.tier} level=${level}: not enough unique phrases; ` +
        `some repeats in round of ${ROUND_SIZE}.`,
    );
  }

  const level4ExtraIdx = new Set<number>();
  if (level === 4) {
    shuffle(sampled.map((_, i) => i))
      .slice(0, Math.min(3, sampled.length))
      .forEach((i) => level4ExtraIdx.add(i));
  }

  const items: RoundItem[] = sampled.map((phrase, i) => ({
    phrase,
    distractorCount: distractorBudget(level, config.settings, level4ExtraIdx.has(i)),
  }));

  return { items, usedReplacement };
}
