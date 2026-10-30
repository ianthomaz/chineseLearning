/** Resolve, per piece, whether pinyin / translation hints are visible. */

import type { AppLocale } from "@/lib/i18n-core";
import type { DisplaySettings, Phrase, Piece } from "./types";

export type PieceDisplay = { showPinyin: boolean; showTranslation: boolean };

/**
 * Mid-phrase help overrides.
 * `pinyin` / `translation` force show; `suppress*` force hide even when
 * setup settings would otherwise show the hint.
 */
export type RevealState = {
  pinyin: boolean;
  translation: boolean;
  suppressPinyin?: boolean;
  suppressTranslation?: boolean;
};

/** Whether any piece would show pinyin from current settings + reveal. */
export function isPinyinShowing(
  settings: DisplaySettings,
  reveal: RevealState,
): boolean {
  if (reveal.suppressPinyin) return false;
  return (
    reveal.pinyin || settings.hanziPlusPinyin || settings.pinyinDifficult
  );
}

/** Whether any piece would show a gloss from current settings + reveal. */
export function isTranslationShowing(
  settings: DisplaySettings,
  reveal: RevealState,
): boolean {
  if (reveal.suppressTranslation) return false;
  return reveal.translation || settings.translationDifficult;
}

export function resolvePieceDisplay(
  piece: Piece,
  settings: DisplaySettings,
  reveal: RevealState,
): PieceDisplay {
  const showPinyin =
    !reveal.suppressPinyin &&
    (reveal.pinyin ||
      settings.hanziPlusPinyin ||
      (settings.pinyinDifficult && piece.dificil));
  const showTranslation =
    !reveal.suppressTranslation &&
    (reveal.translation || (settings.translationDifficult && piece.dificil));
  return { showPinyin, showTranslation };
}

/** Prompt in the user's locale, falling back to Portuguese (locale → pt). */
export function localizedPrompt(phrase: Phrase, locale: AppLocale): string {
  if (locale === "en" && phrase.en) return phrase.en;
  if (locale === "es" && phrase.es) return phrase.es;
  return phrase.pt;
}
