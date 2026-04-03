import type { AppLocale } from "@/lib/i18n-core";

/** UI-language line for glosses and dialogue subtitles */
export type LocalizedLine = {
  pt: string;
  en: string;
  es: string;
};

export function emptyLocalizedLine(): LocalizedLine {
  return { pt: "", en: "", es: "" };
}

export function pickLocalized(L: LocalizedLine, locale: AppLocale): string {
  const primary = L[locale]?.trim();
  if (primary) return primary;
  const pt = L.pt?.trim();
  if (pt) return pt;
  const en = L.en?.trim();
  if (en) return en;
  return L.es?.trim() ?? "";
}
