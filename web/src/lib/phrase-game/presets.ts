/**
 * Named ways to play a round — config presets, nothing more.
 *
 * Each one selects a configuration the player could have assembled by hand in
 * "Customise": a level plus a set of hints. Opening Customise after picking one
 * shows exactly what it selected, and assembling the same combination by hand
 * lights the matching preset back up.
 *
 * A preset deliberately does NOT touch the vocabulary — that is the dropdown
 * above it. And it does not lock anything: every option stays reachable at
 * every level.
 */
import { clampLevelToPool, normalizeDisplaySettings } from "./settings-by-level";
import {
  DEFAULT_DISPLAY_SETTINGS,
  type DisplaySettings,
  type GameLevel,
  type GameTier,
} from "./types";

export type PresetId = "easy" | "medium" | "practise" | "challenge";

export type GamePreset = {
  id: PresetId;
  /** Glyph for the preset card. */
  hanzi: string;
  /** Design token, matching the card colour families used on the home page. */
  color: string;
  level: GameLevel;
  settings: DisplaySettings;
};

function preset(
  id: PresetId,
  hanzi: string,
  color: string,
  level: GameLevel,
  overrides: Partial<DisplaySettings>,
): GamePreset {
  return {
    id,
    hanzi,
    color,
    level,
    settings: normalizeDisplaySettings({ ...DEFAULT_DISPLAY_SETTINGS, ...overrides }),
  };
}

export const GAME_PRESETS: readonly GamePreset[] = [
  // Everything visible: the sentence, pinyin on every piece, a gloss on the hard
  // words. Level 1 keeps words whole, so 跑步 arrives as a single piece.
  preset("easy", "易", "var(--cat-green)", 1, {
    showNativePrompt: true,
    hanziPlusPinyin: true,
    translationDifficult: true,
  }),
  // Same whole words, longer phrases, pinyin still there — no gloss.
  preset("medium", "中", "var(--accent-2)", 2, {
    showNativePrompt: true,
    hanziPlusPinyin: true,
  }),
  // Longer phrases and bare hanzi pieces; the sentence is still shown.
  preset("practise", "练", "var(--accent)", 3, {
    showNativePrompt: true,
  }),
  // Words broken into single characters, spare pieces mixed in, nothing revealed
  // unless the player asks for it mid-round.
  preset("challenge", "战", "var(--cat-violet)", 4, {
    addExtraHanzi: true,
  }),
];

export function findPreset(id: PresetId): GamePreset | undefined {
  return GAME_PRESETS.find((p) => p.id === id);
}

/**
 * A preset applied on top of the vocabulary the player already chose. The pool
 * decides the ceiling — HSK 1 has no phrases long enough for level 3+ — so
 * "Challenge" on HSK 1 means the hardest round HSK 1 can produce.
 */
export function applyPreset(
  preset: GamePreset,
  tier: GameTier,
): { level: GameLevel; settings: DisplaySettings } {
  return {
    level: clampLevelToPool(tier, preset.level),
    settings: normalizeDisplaySettings(preset.settings),
  };
}

/**
 * Which preset the current configuration corresponds to, or null if the player
 * has assembled something of their own. Compared against the preset as the
 * chosen vocabulary would apply it, so a clamped Challenge still reads as
 * Challenge.
 */
export function matchPreset(
  tier: GameTier,
  level: GameLevel,
  settings: DisplaySettings,
): PresetId | null {
  const current = normalizeDisplaySettings(settings);
  const keys = Object.keys(current) as Array<keyof DisplaySettings>;

  const hit = GAME_PRESETS.find((candidate) => {
    const applied = applyPreset(candidate, tier);
    return applied.level === level && keys.every((k) => applied.settings[k] === current[k]);
  });

  return hit?.id ?? null;
}
