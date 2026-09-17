/**
 * Named ways to play a round.
 *
 * A preset decides HOW the round behaves — phrase length, whether words are
 * split into characters, which hints start on, whether extra pieces are mixed
 * in. It deliberately does NOT touch the vocabulary: that is the dropdown above
 * it, and a preset overriding the player's own choice was the bug this replaced.
 *
 * Presets carry no new game rules: they are values the setup screen could always
 * have produced. The full controls stay available under "Customise".
 */
import { clampDisplaySettingsForLevel, clampLevelToPool } from "./settings-by-level";
import {
  DEFAULT_DISPLAY_SETTINGS,
  type DisplaySettings,
  type GameLevel,
  type GameTier,
} from "./types";

export type PresetId = "comecar" | "treinar" | "desafio";

export type GamePreset = {
  id: PresetId;
  /** Glyph for the preset card. */
  hanzi: string;
  /** Design token, matching the card colour families used on the home page. */
  color: string;
  level: GameLevel;
  settings: DisplaySettings;
};

/**
 * `hanziOnly` is derived, not chosen: pieces show bare hanzi exactly when no
 * per-piece hint is on. Mirrors the setup screen's own normalisation.
 */
function normalize(settings: DisplaySettings): DisplaySettings {
  const anyPieceHint =
    settings.hanziPlusPinyin || settings.pinyinDifficult || settings.translationDifficult;
  return { ...settings, hanziOnly: !anyPieceHint };
}

function preset(
  id: PresetId,
  hanzi: string,
  color: string,
  level: GameLevel,
  overrides: Partial<DisplaySettings>,
): GamePreset {
  // Clamp through the same rules the level enforces, so a preset can never
  // describe a combination the game would silently undo.
  const settings = clampDisplaySettingsForLevel(
    level,
    normalize({ ...DEFAULT_DISPLAY_SETTINGS, ...overrides }),
  );
  return { id, hanzi, color, level, settings: normalize(settings) };
}

export const GAME_PRESETS: readonly GamePreset[] = [
  // Short phrases, whole words, pinyin on every piece, prompt in view.
  preset("comecar", "始", "var(--cat-green)", 1, {
    showNativePrompt: true,
    hanziPlusPinyin: true,
  }),
  // Longer phrases, whole words, gloss on the hard ones only.
  preset("treinar", "练", "var(--accent)", 2, {
    showNativePrompt: true,
    translationDifficult: true,
  }),
  // Long phrases, words split into characters, extra pieces, no hints on.
  // Level 4 already forces the extra hanzi.
  preset("desafio", "战", "var(--cat-violet)", 4, {}),
];

/**
 * A preset applied on top of the vocabulary the player already chose. The pool
 * decides the ceiling — HSK 1 has no phrases long enough for level 3+ — so
 * "Challenge" on HSK 1 means the hardest round HSK 1 can produce.
 */
export function applyPreset(
  preset: GamePreset,
  tier: GameTier,
): { level: GameLevel; settings: DisplaySettings } {
  const level = clampLevelToPool(tier, preset.level);
  return {
    level,
    settings: normalize(clampDisplaySettingsForLevel(level, preset.settings)),
  };
}

export function findPreset(id: PresetId): GamePreset | undefined {
  return GAME_PRESETS.find((p) => p.id === id);
}

/**
 * Which preset the current configuration corresponds to, or null if custom.
 * Compared against the preset as the chosen vocabulary would apply it, so a
 * clamped "Challenge" on HSK 1 still reads as Challenge.
 */
export function matchPreset(
  tier: GameTier,
  level: GameLevel,
  settings: DisplaySettings,
): PresetId | null {
  const current = normalize(settings);
  const keys = Object.keys(current) as Array<keyof DisplaySettings>;

  const hit = GAME_PRESETS.find((preset) => {
    const applied = applyPreset(preset, tier);
    return applied.level === level && keys.every((k) => applied.settings[k] === current[k]);
  });

  return hit?.id ?? null;
}
