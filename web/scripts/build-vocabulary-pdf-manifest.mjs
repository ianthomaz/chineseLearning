/**
 * Syncs web/pdf-content/*.pdf with src/data/vocabulary-pdf-downloads.json (seed input).
 *
 * The JSON is the editorial catalog for `seed:content` → `visual_pdf_entries`.
 * Binary PDFs stay on disk (pdf-content/ → public/downloads/); the site lists
 * Visuais from SQLite when CONTENT_SOURCE=db.
 *
 * Rules:
 * - 0 PDFs on disk → keep catalog (do not wipe to []).
 * - Some PDFs on disk → merge by filename (add/update); never drop catalog rows
 *   that are only missing from this machine's pdf-content/.
 * - Full replace only when every existing catalog file is present on disk
 *   (or catalog was empty).
 *
 * Run after sync-pdf-downloads.sh in predev/prebuild.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.join(__dirname, "..");
const pdfDir = path.join(webDir, "pdf-content");
const outPath = path.join(webDir, "src", "data", "vocabulary-pdf-downloads.json");

function rowFromFile(file, index) {
  const m = /^chineseVocabulary(\d+)\.pdf$/i.exec(file);
  const stem = file.replace(/\.pdf$/i, "");
  const label = m ? m[1] : String(index + 1);
  return {
    id: String(index + 1),
    file,
    title_pt: m ? `Vocabulário chinês ${label}` : stem,
    title_en: m ? `Chinese vocabulary ${label}` : stem,
    title_es: m ? `Vocabulario chino ${label}` : stem,
  };
}

function readCatalog() {
  try {
    const prev = JSON.parse(fs.readFileSync(outPath, "utf8"));
    return Array.isArray(prev.pdfs) ? prev.pdfs : [];
  } catch {
    return [];
  }
}

function writeCatalog(pdfs) {
  // Stable ids by sort order of file name
  const sorted = [...pdfs].sort((a, b) =>
    a.file.localeCompare(b.file, undefined, { sensitivity: "base", numeric: true }),
  );
  const withIds = sorted.map((row, i) => ({ ...row, id: String(i + 1) }));
  fs.writeFileSync(outPath, `${JSON.stringify({ pdfs: withIds }, null, 2)}\n`, "utf8");
  return withIds;
}

function main() {
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }

  const files = fs
    .readdirSync(pdfDir)
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base", numeric: true }));

  const existing = readCatalog();

  if (files.length === 0) {
    console.log(
      `build-vocabulary-pdf-manifest: no PDFs in pdf-content/ — keeping catalog (${existing.length} entries).`,
    );
    return;
  }

  const onDisk = new Set(files);
  const existingFiles = new Set(existing.map((r) => r.file));
  const allExistingPresent =
    existing.length > 0 && [...existingFiles].every((f) => onDisk.has(f));

  if (allExistingPresent || existing.length === 0) {
    const pdfs = files.map((file, i) => rowFromFile(file, i));
    const written = writeCatalog(pdfs);
    console.log(
      `build-vocabulary-pdf-manifest: ${written.length} PDF(s) from pdf-content/ → vocabulary-pdf-downloads.json`,
    );
    return;
  }

  // Partial disk: merge — keep missing catalog rows, refresh/add present files.
  const byFile = new Map(existing.map((r) => [r.file, { ...r }]));
  files.forEach((file, i) => {
    const next = rowFromFile(file, i);
    const prev = byFile.get(file);
    byFile.set(file, prev ? { ...prev, ...next, id: prev.id } : next);
  });
  const written = writeCatalog([...byFile.values()]);
  const kept = written.filter((r) => !onDisk.has(r.file)).length;
  console.log(
    `build-vocabulary-pdf-manifest: merged disk (${files.length}) + catalog keep (${kept} missing on disk) → ${written.length} entries.`,
  );
}

main();
