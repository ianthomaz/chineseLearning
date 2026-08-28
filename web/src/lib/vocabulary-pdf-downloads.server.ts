import { getDb } from "@/server/db";
import { contentSource } from "@/lib/content/content-repository";
import type { VocabPdfRow } from "./vocabulary-pdf-downloads";

function loadFromJson(): VocabPdfRow[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const raw = require("@/data/vocabulary-pdf-downloads.json") as {
    pdfs: Omit<VocabPdfRow, "desc_pt" | "desc_en" | "desc_es">[];
  };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const descriptions = require("@/data/vocabulary-pdf-descriptions.json") as Record<
    string,
    { en: string; pt: string; es: string }
  >;
  return raw.pdfs.map((row) => {
    const d = descriptions[row.file];
    if (!d) return row;
    return { ...row, desc_pt: d.pt, desc_en: d.en, desc_es: d.es };
  });
}

function loadFromDb(): VocabPdfRow[] {
  const rows = getDb()
    .prepare(`SELECT payload_json FROM visual_pdf_entries ORDER BY sort_order ASC`)
    .all() as { payload_json: string }[];
  // JSON.parse → plain objects (safe for Client Component props).
  return rows.map((r) => JSON.parse(String(r.payload_json)) as VocabPdfRow);
}

/** Site Visuais catalog: DB when CONTENT_SOURCE=db (after seed:content). */
export function getVisualPdfCatalog(): { pdfs: VocabPdfRow[] } {
  if (contentSource() === "json") return { pdfs: loadFromJson() };
  try {
    return { pdfs: loadFromDb() };
  } catch (err) {
    console.warn("[visuals] DB read failed — run npm run seed:content", err);
    return { pdfs: [] };
  }
}
