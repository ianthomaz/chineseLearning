/**
 * Named starting points for a round.
 *
 * The setup screen used to ask eight separate questions (vocabulary tier, game
 * level, five hint checkboxes) before the player had seen a single phrase — and
 * every one of those hints is already available as a one-tap button during play.
 * A preset is one decision that expands into a legal (tier, level, settings)
 * triple; the full controls stay available under "Personalizar".
 *
 * Presets carry no new game rules: they are values the setup screen could always
 * have produced.
 */
import { clampDisplaySettingsForLevel } from "./settings-by-level";
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
  tier: GameTier;
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
  tier: GameTier,
  level: GameLevel,
  overrides: Partial<DisplaySettings>,
): GamePreset {
  // Clamp through the same rules the level enforces, so a preset can never
  // describe a combination the game would silently undo.
  const settings = clampDisplaySettingsForLevel(
    level,
    normalize({ ...DEFAULT_DISPLAY_SETTINGS, ...overrides }),
  );
  return { id, hanzi, color, tier, level, settings: normalize(settings) };
}

export const GAME_PRESETS: readonly GamePreset[] = [
  // HSK1 only, short phrases, pinyin on every piece and the prompt in view.
  preset("comecar", "始", "var(--cat-green)", "hsk1", 1, {
    showNativePrompt: true,
    hanziPlusPinyin: true,
  }),
  // HSK2+ pool, up to ~5 words, prompt still shown, gloss on the hard words only.
  preset("treinar", "练", "var(--accent)", "hsk2plus", 2, {
    showNativePrompt: true,
    translationDifficult: true,
  }),
  // Full bank, long phrases, words split into characters, distractors, no prompt
  // unless asked for. Level 4 already forces the extra hanzi.
  preset("desafio", "战", "var(--cat-violet)", "hsk3", 4, {}),
];

export function findPreset(id: PresetId): GamePreset | undefined {
  return GAME_PRESETS.find((p) => p.id === id);
}

/** Which preset the current configuration corresponds to, or null if custom. */
export function matchPreset(
  tier: GameTier,
  level: GameLevel,
  settings: DisplaySettings,
): PresetId | null {
  const current = normalize(settings);
  const hit = GAME_PRESETS.find(
    (p) =>
      p.tier === tier &&
      p.level === level &&
      (Object.keys(p.settings) as Array<keyof DisplaySettings>).every(
        (k) => p.settings[k] === current[k],
      ),
  );
  return hit?.id ?? null;
}
