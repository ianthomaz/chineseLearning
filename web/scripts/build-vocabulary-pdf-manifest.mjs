/**
 * Scans web/pdf-content/*.pdf and writes src/data/vocabulary-pdf-downloads.json.
 * Long-form blurbs per file live in src/data/vocabulary-pdf-descriptions.json (merged at runtime).
 * No placeholder rows — only files that exist. Run after sync-pdf-downloads.sh in predev/prebuild.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.join(__dirname, "..");
const pdfDir = path.join(webDir, "pdf-content");
const outPath = path.join(webDir, "src", "data", "vocabulary-pdf-downloads.json");

function main() {
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }

  const files = fs
    .readdirSync(pdfDir)
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base", numeric: true }));

  const pdfs = files.map((file, index) => {
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
  });

  fs.writeFileSync(outPath, `${JSON.stringify({ pdfs }, null, 2)}\n`, "utf8");
  console.log(
    `build-vocabulary-pdf-manifest: ${pdfs.length} PDF(s) from pdf-content/ → vocabulary-pdf-downloads.json`,
  );
}

main();
