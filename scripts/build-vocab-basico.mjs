#!/usr/bin/env node
/**
 * Merge course vocabulary into vocabulario/vocab-basico.json
 * Sources: lexicon-base.json, consolidado.json, rag_knowledge/*.md (hanzi scan)
 *
 * Annotates hsk1: true on entries that match the HSK1 reference list
 * (consolidado vocab blocks 1–16 + hsk1-quiz-bank). Everything else is
 * implicit basic (HSK1+2). Beginner tier is derived later from hsk1.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const HANZI_RE = /[\u4e00-\u9fff\u3400-\u4dbf]+/g;
const OUT = path.join(ROOT, "vocabulario", "vocab-basico.json");
const HSK1_REF = path.join(ROOT, "vocabulario", "hsk1-reference.json");

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function addEntry(map, hanzi, extra = {}) {
  const h = hanzi.replace(/\s+/g, "");
  if (!h || h.length > 12) return;
  const prev = map.get(h) ?? { hanzi: h };
  map.set(h, {
    ...prev,
    ...Object.fromEntries(Object.entries(extra).filter(([, v]) => v)),
    sources: [...new Set([...(prev.sources ?? []), ...(extra.sources ?? [])])],
  });
}

function fromLexicon(map) {
  const data = readJson("vocabulario/lexicon-base.json");
  for (const items of Object.values(data.groups ?? {})) {
    for (const row of items) {
      addEntry(map, row.hanzi, {
        pinyin: row.pinyin,
        gloss_pt: row.gloss_pt,
        sources: ["lexicon-base"],
      });
    }
  }
}

function buildHsk1Reference() {
  /** Canonical HSK1 word forms — consolidado course vocab + quiz bank. */
  const set = new Set();
  const { blocks } = readJson("web/src/data/consolidado.json");
  for (const block of blocks) {
    if (block.id > 16) continue;
    for (const v of block.vocabulary ?? []) {
      const h = v.hanzi.replace(/\s/g, "");
      if (h) set.add(h);
    }
  }
  try {
    const bank = readJson("web/src/data/gamification/hsk1-quiz-bank.json");
    for (const q of bank.questions ?? []) {
      const h = q.hanzi?.replace(/\s/g, "");
      if (h) set.add(h);
    }
  } catch {
    /* optional */
  }
  return [...set].sort((a, b) => a.localeCompare(b, "zh"));
}

function fromConsolidado(map, hsk1Set) {
  const { blocks } = readJson("web/src/data/consolidado.json");
  for (const block of blocks) {
    for (const s of block.structures ?? []) {
      const parts = s.hanzi.split(/[，。！？、；：\s]+/).filter(Boolean);
      for (const p of parts) {
        for (const m of p.match(HANZI_RE) ?? []) addEntry(map, m, { sources: ["consolidado-structure"] });
      }
      addEntry(map, s.hanzi.replace(/[，。！？、]/g, ""), {
        pinyin: s.pinyin,
        sources: ["consolidado-structure"],
      });
    }
    for (const v of block.vocabulary ?? []) {
      const h = v.hanzi.replace(/\s/g, "");
      addEntry(map, v.hanzi, {
        pinyin: v.pinyin,
        gloss_pt: v.translation,
        sources: ["consolidado-vocab"],
        ...(block.id <= 16 && hsk1Set.has(h) ? { hsk1: true } : {}),
      });
    }
  }
}

function fromRag(map) {
  const dir = path.join(ROOT, "rag_knowledge");
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".md"))) {
    const text = fs.readFileSync(path.join(dir, file), "utf8");
    for (const m of text.match(HANZI_RE) ?? []) {
      if (m.length <= 6) addEntry(map, m, { sources: [`rag:${file}`] });
    }
  }
}

function main() {
  const hsk1List = buildHsk1Reference();
  const hsk1Set = new Set(hsk1List);
  fs.writeFileSync(
    HSK1_REF,
    `${JSON.stringify({ version: 1, generated_at: new Date().toISOString(), count: hsk1List.length, words: hsk1List }, null, 2)}\n`,
    "utf8",
  );

  const map = new Map();
  fromLexicon(map);
  fromConsolidado(map, hsk1Set);
  fromRag(map);

  const entries = [...map.values()]
    .map((e) => {
      const row = { ...e };
      if (hsk1Set.has(row.hanzi)) row.hsk1 = true;
      return row;
    })
    .sort((a, b) => a.hanzi.localeCompare(b.hanzi, "zh"));

  const hsk1Count = entries.filter((e) => e.hsk1).length;
  const payload = {
    version: 2,
    generated_at: new Date().toISOString(),
    purpose: "Course lexicon; hsk1 marks official HSK1 words (beginner subset derived later)",
    stats: { total: entries.length, hsk1: hsk1Count, basic: entries.length - hsk1Count },
    entries,
  };
  fs.writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`hsk1-reference: ${hsk1List.length} words → ${HSK1_REF}`);
  console.log(`vocab-basico: ${entries.length} entries (${hsk1Count} hsk1) → ${OUT}`);
}

main();
