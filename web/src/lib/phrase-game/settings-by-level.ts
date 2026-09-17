import type { DisplaySettings, GameLevel, GameTier } from "./types";

/**
 * Difficulty and hints are separate choices.
 *
 * The level decides how the round is built — phrase length, and whether words
 * are split into single characters. The hints decide what the player can see.
 * Levels used to forcibly strip hints (no pinyin above level 1, no translation
 * above level 2), which made combinations like "longer phrases, but keep the
 * pinyin" impossible to ask for. They are independent now: a preset picks a
 * sensible pairing, and the player can pick any other.
 *
 * The one thing still derived rather than chosen is `hanziOnly` — see below.
 */

/**
 * Pieces show bare hanzi exactly when no per-piece hint is on, so `hanziOnly` is
 * a consequence of the other flags rather than a separate switch.
 */
export function normalizeDisplaySettings(settings: DisplaySettings): DisplaySettings {
  const anyPieceHint =
    settings.hanziPlusPinyin || settings.pinyinDifficult || settings.translationDifficult;
  return { ...settings, hanziOnly: !anyPieceHint };
}

/**
 * Hardest level the chosen vocabulary supports. HSK 1 has no phrases long
 * enough for levels 3+, so the level list and the presets both stop at 2.
 * One place, because three callers used to hard-code it.
 */
export function maxLevelForPool(tier: GameTier): GameLevel {
  return tier === "hsk1" ? 2 : 5;
}

/** Level clamped to what the chosen vocabulary allows. */
export function clampLevelToPool(tier: GameTier, level: GameLevel): GameLevel {
  const max = maxLevelForPool(tier);
  return level > max ? max : level;
}
