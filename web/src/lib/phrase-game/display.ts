/** Resolve, per piece, whether pinyin / translation hints are visible. */

import type { AppLocale } from "@/lib/i18n-core";
import type { DisplaySettings, Phrase, Piece } from "./types";

export type PieceDisplay = { showPinyin: boolean; showTranslation: boolean };

/** Mid-phrase help reveals (override the display settings when active). */
export type RevealState = { pinyin: boolean; translation: boolean };

export function resolvePieceDisplay(
  piece: Piece,
  settings: DisplaySettings,
  reveal: RevealState,
): PieceDisplay {
  const showPinyin =
    reveal.pinyin ||
    settings.hanziPlusPinyin ||
    (settings.pinyinDifficult && piece.dificil);
  const showTranslation =
    reveal.translation || (settings.translationDifficult && piece.dificil);
  return { showPinyin, showTranslation };
}

/** Prompt in the user's locale, falling back to Portuguese (locale → pt). */
export function localizedPrompt(phrase: Phrase, locale: AppLocale): string {
  if (locale === "en" && phrase.en) return phrase.en;
  if (locale === "es" && phrase.es) return phrase.es;
  return phrase.pt;
}
