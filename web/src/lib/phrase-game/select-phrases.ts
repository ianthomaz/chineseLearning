/**
 * Round building: filter the phrase pool by tier + level, then sample 10 phrases
 * and decide each one's distractor budget per the level rules (global max 2).
 */

import {
  type DisplaySettings,
  type GameLevel,
  type GameTier,
  type Phrase,
  type RoundConfig,
  type RoundItem,
  ROUND_SIZE,
} from "./types";

/** Tier filter: Iniciante = HSK1-only; everything else uses the full basic lexicon. */
function tierFilter(phrases: Phrase[], tier: GameTier): Phrase[] {
  if (tier === "iniciante") return phrases.filter((p) => p.tier === "hsk1");
  return phrases;
}

/** Token-count band per level. Falls back to the whole tier pool if a band is empty. */
function levelBand(phrases: Phrase[], level: GameLevel): Phrase[] {
  const count = (p: Phrase) => p.tokens.length;
  let band: Phrase[];
  if (level === 1) band = phrases.filter((p) => count(p) <= 3);
  else if (level === 2) band = phrases.filter((p) => count(p) <= 5);
  else band = phrases.filter((p) => count(p) >= 4);
  return band.length > 0 ? band : phrases;
}

function sample<T>(pool: T[], n: number): { items: T[]; usedReplacement: boolean } {
  if (pool.length === 0) return { items: [], usedReplacement: false };
  if (pool.length >= n) {
    // Sample without replacement.
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return { items: shuffled.slice(0, n), usedReplacement: false };
  }
  // Pool too small — sample with replacement and warn (dev only).
  const items: T[] = [];
  for (let i = 0; i < n; i += 1) {
    items.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return { items, usedReplacement: true };
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
  const pool = levelBand(tierFilter(phrases, config.tier), config.level);
  const { items: sampled, usedReplacement } = sample(pool, ROUND_SIZE);

  if (usedReplacement && process.env.NODE_ENV !== "production") {
    console.warn(
      `[phrase-game] pool for tier=${config.tier} level=${config.level} has only ` +
        `${pool.length} phrase(s); sampling ${ROUND_SIZE} with replacement.`,
    );
  }

  // Level 4: exactly ~3 of the 10 phrases receive one extra distractor.
  const level4ExtraIdx = new Set<number>();
  if (config.level === 4) {
    const indices = sampled.map((_, i) => i).sort(() => Math.random() - 0.5);
    indices.slice(0, Math.min(3, sampled.length)).forEach((i) => level4ExtraIdx.add(i));
  }

  const items: RoundItem[] = sampled.map((phrase, i) => ({
    phrase,
    distractorCount: distractorBudget(config.level, config.settings, level4ExtraIdx.has(i)),
  }));

  return { items, usedReplacement };
}
