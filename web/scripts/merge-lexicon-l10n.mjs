#!/usr/bin/env node
/**
 * Merge web/data/app-library/lexicon-l10n.json into library.json + ios/lexico.json.
 *
 * Adds translationEn/Es on entries and titleEn/Es on categories (and denormalized
 * rotationCategoryTitleEn/Es on each entry). Bumps contentVersion.
 *
 * Usage (from web/):
 *   node scripts/merge-lexicon-l10n.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB = resolve(__dirname, "..");
const ROOT = resolve(WEB, "..");
const libPath = join(WEB, "data", "app-library", "library.json");
const l10nPath = join(WEB, "data", "app-library", "lexicon-l10n.json");
const iosPath = join(ROOT, "appMobile", "ios", "lexico.json");
const metaPath = join(WEB, "data", "app-library", "meta.json");

if (!existsSync(l10nPath)) {
  console.error(`[merge-lexicon-l10n] missing ${l10nPath}`);
  process.exit(1);
}
if (!existsSync(libPath)) {
  console.error(`[merge-lexicon-l10n] missing ${libPath}`);
  process.exit(1);
}

const l10n = JSON.parse(readFileSync(l10nPath, "utf8"));
const pack = JSON.parse(readFileSync(libPath, "utf8"));
const cats = l10n.categories || {};
const ents = l10n.entries || {};

let catHits = 0;
for (const c of pack.rotationCategories || []) {
  const row = cats[c.id];
  if (!row) continue;
  if (row.en) {
    c.titleEn = row.en;
    catHits++;
  }
  if (row.es) c.titleEs = row.es;
}

let entHits = 0;
for (const e of pack.entries || []) {
  const row = ents[e.id];
  const cat = cats[e.rotationCategoryId];
  if (cat?.en) e.rotationCategoryTitleEn = cat.en;
  if (cat?.es) e.rotationCategoryTitleEs = cat.es;
  if (!row) continue;
  if (row.en) {
    e.translationEn = row.en;
    entHits++;
  }
  if (row.es) e.translationEs = row.es;
}

const prev = pack.meta?.contentVersion ?? pack.meta?.version ?? 1;
const next = Number(prev) + 1;
pack.meta = {
  ...(pack.meta || {}),
  contentVersion: next,
  version: next,
  generatedAt: new Date().toISOString(),
};

const body = `${JSON.stringify(pack)}\n`;
writeFileSync(libPath, body);
writeFileSync(iosPath, body);

if (existsSync(metaPath)) {
  const meta = JSON.parse(readFileSync(metaPath, "utf8"));
  meta.contentVersion = next;
  meta.generatedAt = pack.meta.generatedAt;
  meta.byteSize = Buffer.byteLength(body);
  meta.sha256 = createHash("sha256").update(body).digest("hex");
  writeFileSync(metaPath, `${JSON.stringify(meta, null, 2)}\n`);
}

console.log("[merge-lexicon-l10n] OK", {
  contentVersion: next,
  categoriesPatched: catHits,
  entriesPatched: entHits,
  entriesTotal: pack.entries?.length ?? 0,
  wrote: [libPath, iosPath],
});
