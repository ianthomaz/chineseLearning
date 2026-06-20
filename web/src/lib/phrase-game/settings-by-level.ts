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
    next.hanziOnly = !next.translationDifficult;
  }

  if (level >= 3) {
    next.translationDifficult = false;
    next.showNativePrompt = false;
    if (!next.pinyinDifficult && !next.hanziPlusPinyin) {
      next.hanziOnly = true;
    }
  }

  if (level >= 4) {
    next.addExtraHanzi = true;
  }

  return next;
}

/** Pinyin-on-pieces hints (level 1 only). */
export function pinyinHintsDisabled(level: GameLevel): boolean {
  return level >= 2;
}

/** PT gloss on difficult tokens — allowed at levels 1–2 (e.g. Iniciante “até ~5 palavras”). */
export function translationDifficultDisabled(level: GameLevel): boolean {
  return level >= 3;
}

export function nativePromptDisabled(level: GameLevel): boolean {
  return level >= 3;
}
