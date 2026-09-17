#!/usr/bin/env node
/**
 * Build + validate the phrase-game data.
 *
 * Reads FRASES_GAME/curated/phrases.json, fills per-character pinyin via
 * pinyin-pro, validates the schema (max 2 distractors, accepted orders are
 * reorderings of the phrase's pieces), and emits
 * web/src/data/phrase-game/phrases.json.
 *
 * Run from web/: `node scripts/build-phrase-game-data.mjs` (wired into prebuild/predev).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pinyin } from "pinyin-pro";
import { validatePhraseAcceptedOrders } from "./accepted-orders-lib.mjs";

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

/** Classify runtime pool (mirrors src/lib/phrase-game/assign-pool.ts). */
function assignPhrasePool(raw, tokens) {
  if (raw.tier === "hsk1") return "hsk1";
  const tokenCount = tokens.length;
  const hardCount = tokens.filter((t) => t.dificil).length;
  const nivel = raw.nivel ?? 1;
  if (nivel >= 3 && tokenCount >= 5) return "hsk3";
  if (tokenCount >= 7) return "hsk3";
  if (hardCount >= 3 && tokenCount >= 4) return "hsk3";
  if (nivel >= 4) return "hsk3";
  if (nivel >= 2 && tokenCount >= 4) return "hsk2plus";
  if (hardCount >= 2) return "hsk2plus";
  if (tokenCount >= 6) return "hsk2plus";
  if (nivel >= 3) return "hsk2plus";
  if (hardCount >= 1) return "hsk2";
  if (nivel >= 2) return "hsk2";
  if (tokenCount >= 4) return "hsk2";
  return "hsk2";
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

  // An accepted answer must be a reordering of the very pieces the player gets;
  // anything else could never be built on the board. Last gate before a player
  // sees it — see scripts/accepted-orders-lib.mjs.
  errors.push(
    ...validatePhraseAcceptedOrders({
      id: raw.id ?? "(no id)",
      hanzi,
      pieces: tokens.map((t) => t.palavra),
      accepted: raw.respostasAceitas,
    }),
  );

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

  const pool = assignPhrasePool(raw, tokens);

  return {
    id: raw.id,
    nivel: raw.nivel ?? 1,
    tier: raw.tier,
    pool,
    pt: raw.pt,
    ...(raw.en ? { en: raw.en } : {}),
    ...(raw.es ? { es: raw.es } : {}),
    hanzi,
    pinyin: phrasePinyin,
    tokens,
    distratores,
    ...(Array.isArray(raw.respostasAceitas) && raw.respostasAceitas.length > 0
      ? { respostasAceitas: raw.respostasAceitas }
      : {}),
    tags: Array.isArray(raw.tags) ? raw.tags : ["curated"],
  };
}

function loadCuratedPhrases() {
  return JSON.parse(readFileSync(SRC, "utf8")).phrases ?? [];
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
  const byPool = { hsk1: 0, hsk2: 0, hsk2plus: 0, hsk3: 0 };
  for (const p of phrases) {
    byLevel[p.nivel] = (byLevel[p.nivel] ?? 0) + 1;
    byTier[p.tier] += 1;
    byPool[p.pool] += 1;
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
    `${JSON.stringify({ version: 1, count: phrases.length, byTier, byPool, byLevel, phrases }, null, 2)}\n`,
    "utf8",
  );
  console.log(
    `[phrase-game] OK: ${phrases.length} phrases (pool hsk1=${byPool.hsk1} hsk2=${byPool.hsk2} hsk2+=${byPool.hsk2plus} hsk3=${byPool.hsk3}) → ${OUT}`,
  );
}

main();
