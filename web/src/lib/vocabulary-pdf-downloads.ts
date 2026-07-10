import type { AppLocale } from "@/lib/i18n-core";

export type VocabPdfRow = {
  id: string;
  file: string;
  title_pt: string;
  title_en: string;
  title_es: string;
  desc_pt?: string;
  desc_en?: string;
  desc_es?: string;
};

export function vocabPdfTitle(row: VocabPdfRow, locale: AppLocale): string {
  if (locale === "en") return row.title_en;
  if (locale === "es") return row.title_es;
  return row.title_pt;
}

export function vocabPdfDescription(
  row: VocabPdfRow,
  locale: AppLocale,
): string | undefined {
  if (locale === "en") return row.desc_en;
  if (locale === "es") return row.desc_es;
  return row.desc_pt;
}
