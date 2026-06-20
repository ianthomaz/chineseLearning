import type { DisplaySettings, GameLevel } from "./types";

/** Clear options that higher game levels forbid (see setup screen disabled rules). */
export function clampDisplaySettingsForLevel(
  level: GameLevel,
  settings: DisplaySettings,
): DisplaySettings {
  const next: DisplaySettings = { ...settings };

  if (level >= 2) {
    next.pinyinDifficult = false;
    next.hanziPlusPinyin = false;
    next.translationDifficult = false;
    next.hanziOnly = true;
  }

  if (level >= 3) {
    next.showNativePrompt = false;
  }

  if (level >= 4) {
    next.addExtraHanzi = true;
  }

  return next;
}

export function pieceHintsDisabled(level: GameLevel): boolean {
  return level >= 2;
}

export function nativePromptDisabled(level: GameLevel): boolean {
  return level >= 3;
}
