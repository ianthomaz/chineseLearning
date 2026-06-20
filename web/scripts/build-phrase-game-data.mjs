#!/usr/bin/env node
/**
 * Build + validate the phrase-game data.
 *
 * Reads the hand-authored curated bank:
 *   FRASES_GAME/curated/phrases.json (core)
 *   FRASES_GAME/curated/expansion-*.json (hand-reviewed batches)
 * per-character pinyin via pinyin-pro, validates the canonical schema (max 2
 * distractors, tier consistency, no trivial distractor collisions), and emits the
 * runtime artifact web/src/data/phrase-game/phrases.json.
 *
 * Run from web/: `node scripts/build-phrase-game-data.mjs` (wired into prebuild/predev).
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pinyin } from "pinyin-pro";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(__dirname, "..");
const REPO_ROOT = join(WEB_ROOT, "..");

const CURATED_DIR = join(REPO_ROOT, "FRASES_GAME", "curated");
const SRC = join(CURATED_DIR, "phrases.json");
const VOCAB = join(REPO_ROOT, "vocabulario", "vocab-basico.json");
const OUT_DIR = join(WEB_ROOT, "src", "data", "phrase-game");
const OUT = join(OUT_DIR, "phrases.json");

const errors = [];
const warnings = [];

function loadVocab() {
  const data = JSON.parse(readFileSync(VOCAB, "utf8"));
  const hsk1 = new Set();
  const gloss = new Map();
  const pinyinMap = new Map();
  for (const e of data.entries ?? []) {
    if (e.hsk1) hsk1.add(e.hanzi);
    if (e.gloss_pt) gloss.set(e.hanzi, e.gloss_pt);
    if (e.pinyin) pinyinMap.set(e.hanzi, e.pinyin);
  }
  return { hsk1, gloss, pinyinMap };
}

/** Per-character pinyin (tone marks). Falls back to whole-word pinyin if counts mismatch. */
function charPinyin(word) {
  const syllables = pinyin(word, { type: "array", toneType: "symbol", nonZh: "consecutive" });
  const chars = [...word];
  if (syllables.length === chars.length) {
    return chars.map((h, i) => ({ hanzi: h, pinyin: syllables[i] }));
  }
  return chars.map((h) => ({ hanzi: h, pinyin: "" }));
}

function wordPinyin(word) {
  return pinyin(word, { toneType: "symbol", nonZh: "consecutive" });
}

function buildToken(word) {
  return {
    palavra: word.palavra,
    caracteres: charPinyin(word.palavra),
    pinyin: wordPinyin(word.palavra),
    pt: word.pt ?? "",
    dificil: Boolean(word.dificil),
  };
}

function buildDistractor(hanzi, vocab) {
  return {
    hanzi,
    pinyin: vocab.pinyinMap.get(hanzi) ?? wordPinyin(hanzi),
    pt: vocab.gloss.get(hanzi) ?? "",
  };
}

function buildPhrase(raw, vocab) {
  const where = `phrase ${raw.id ?? "(no id)"}`;
  if (!raw.id) errors.push(`${where}: missing id`);
  if (!Array.isArray(raw.words) || raw.words.length === 0) {
    errors.push(`${where}: missing words[]`);
    return null;
  }
  if (!raw.pt) errors.push(`${where}: missing pt prompt`);
  if (raw.tier !== "hsk1" && raw.tier !== "basico") {
    errors.push(`${where}: tier must be "hsk1" or "basico"`);
  }

  const tokens = raw.words.map(buildToken);
  const hanzi = tokens.map((t) => t.palavra).join("");
  const phrasePinyin = tokens.map((t) => t.pinyin).join(" ");

  const distratoresRaw = Array.isArray(raw.distratores) ? raw.distratores : [];
  if (distratoresRaw.length > 2) {
    errors.push(`${where}: ${distratoresRaw.length} distractors (max 2)`);
  }
  const tokenSet = new Set(tokens.map((t) => t.palavra));
  const distratores = distratoresRaw.slice(0, 2).map((d) => {
    if (tokenSet.has(d)) {
      warnings.push(`${where}: distractor "${d}" collides with an answer token`);
    }
    if (hanzi.includes(d)) {
      warnings.push(`${where}: distractor "${d}" appears inside the answer hanzi`);
    }
    return buildDistractor(d, vocab);
  });

  // Tier consistency: HSK1 phrases should use HSK1 vocabulary.
  if (raw.tier === "hsk1") {
    for (const t of tokens) {
      if (!vocab.hsk1.has(t.palavra)) {
        warnings.push(`${where}: token "${t.palavra}" not flagged hsk1 in vocab-basico`);
      }
    }
  }

  return {
    id: raw.id,
    nivel: raw.nivel ?? 1,
    tier: raw.tier,
    pt: raw.pt,
    ...(raw.en ? { en: raw.en } : {}),
    ...(raw.es ? { es: raw.es } : {}),
    hanzi,
    pinyin: phrasePinyin,
    tokens,
    distratores,
    ...(Array.isArray(raw.respostasAceitas) ? { respostasAceitas: raw.respostasAceitas } : {}),
    tags: Array.isArray(raw.tags) ? raw.tags : ["curated"],
  };
}

function loadCuratedPhrases() {
  const rawList = [];
  rawList.push(...(JSON.parse(readFileSync(SRC, "utf8")).phrases ?? []));
  for (const name of readdirSync(CURATED_DIR).sort()) {
    if (!name.startsWith("expansion-") || !name.endsWith(".json")) continue;
    const batch = JSON.parse(readFileSync(join(CURATED_DIR, name), "utf8"));
    rawList.push(...(batch.phrases ?? []));
  }
  return rawList;
}

function main() {
  const vocab = loadVocab();
  const phrases = [];
  const ids = new Set();

  for (const raw of loadCuratedPhrases()) {
    if (raw.id && ids.has(raw.id)) errors.push(`duplicate id: ${raw.id}`);
    if (raw.id) ids.add(raw.id);
    const built = buildPhrase(raw, vocab);
    if (built) phrases.push(built);
  }

  const byLevel = {};
  const byTier = { hsk1: 0, basico: 0 };
  for (const p of phrases) {
    byLevel[p.nivel] = (byLevel[p.nivel] ?? 0) + 1;
    byTier[p.tier] += 1;
  }

  for (const w of warnings) console.warn(`[phrase-game] WARN ${w}`);
  if (errors.length > 0) {
    for (const e of errors) console.error(`[phrase-game] ERROR ${e}`);
    console.error(`[phrase-game] build failed: ${errors.length} error(s).`);
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(
    OUT,
    `${JSON.stringify({ version: 1, count: phrases.length, byTier, byLevel, phrases }, null, 2)}\n`,
    "utf8",
  );
  console.log(
    `[phrase-game] OK: ${phrases.length} phrases (hsk1=${byTier.hsk1}, basico=${byTier.basico}) → ${OUT}`,
  );
}

main();
