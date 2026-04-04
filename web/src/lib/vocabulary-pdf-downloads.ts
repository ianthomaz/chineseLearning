import type { AppLocale } from "@/lib/i18n-core";
import raw from "@/data/vocabulary-pdf-downloads.json";
import descriptionsByFile from "@/data/vocabulary-pdf-descriptions.json";

type PdfDescriptionLocales = {
  en: string;
  pt: string;
  es: string;
};

const descriptions = descriptionsByFile as Record<string, PdfDescriptionLocales>;

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

type RawRow = Omit<VocabPdfRow, "desc_pt" | "desc_en" | "desc_es">;

function mergeDescriptions(pdfs: RawRow[]): VocabPdfRow[] {
  return pdfs.map((row) => {
    const d = descriptions[row.file];
    if (!d) return row;
    return { ...row, desc_pt: d.pt, desc_en: d.en, desc_es: d.es };
  });
}

export const vocabularyPdfDownloads: { pdfs: VocabPdfRow[] } = {
  pdfs: mergeDescriptions((raw as { pdfs: RawRow[] }).pdfs),
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
