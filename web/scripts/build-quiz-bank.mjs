#!/usr/bin/env node
/**
 * Merge hand-curated quiz questions with auto-generated vocabulary MC questions
 * from consolidado, vocab-basico, books, phrase-game tokens, and context decks.
 *
 * Output: src/data/gamification/hsk1-quiz-bank.json
 * Run from web/: node scripts/build-quiz-bank.mjs
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(__dirname, "..");
const REPO_ROOT = join(WEB_ROOT, "..");

const BANK_PATH = join(WEB_ROOT, "src/data/gamification/hsk1-quiz-bank.json");
const CONSOLIDADO = join(WEB_ROOT, "src/data/consolidado.json");
const VOCAB_BASICO = join(REPO_ROOT, "vocabulario/vocab-basico.json");
const PHRASES = join(WEB_ROOT, "src/data/phrase-game/phrases.json");
const BOOKS_CURATED = join(REPO_ROOT, "OrganizeVocabulary_books/curated");
const CONTEXT_DECKS = join(WEB_ROOT, "src/data/context-decks");

const TARGET_GENERATED = 600;
const OPTIONS_COUNT = 3;
const POOL_RANK = { hsk1: 0, hsk2: 1, hsk2plus: 2, hsk3: 3 };

/** Target generated MC per pool (exclusive band). */
const POOL_TARGETS = {
  hsk1: 200,
  hsk2: 100,
  hsk2plus: 180,
  hsk3: 120,
};

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

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

function deterministicSort(items, keyFn) {
  return [...items].sort((a, b) => hashString(keyFn(a)) - hashString(keyFn(b)));
}

/** Drop parenthetical gloss detail — "um (contagem…)" → "um". */
function shortGloss(text) {
  if (!text) return "";
  const trimmed = String(text).trim();
  const paren = trimmed.indexOf(" (");
  return (paren >= 0 ? trimmed.slice(0, paren) : trimmed).trim();
}

function isQuizCandidate(hanzi) {
  if (!hanzi || hanzi.includes("___")) return false;
  if (hanzi.length > 8) return false;
  if (/[，。！？、；：？！]/.test(hanzi)) return false;
  return true;
}

function loadHsk1Set(vocabBasico) {
  const set = new Set();
  for (const e of vocabBasico.entries ?? []) {
    if (e.hsk1 && e.hanzi) set.add(e.hanzi);
  }
  return set;
}

function loadPhraseTokenData() {
  const bank = readJson(PHRASES);
  const tokenPool = new Map();
  const tokenMeta = new Map();

  for (const phrase of bank.phrases ?? []) {
    const phrasePool = phrase.pool ?? "hsk1";
    for (const token of phrase.tokens ?? []) {
      const word = token.palavra;
      if (!word) continue;
      const prev = tokenPool.get(word);
      if (!prev || POOL_RANK[phrasePool] > POOL_RANK[prev]) {
        tokenPool.set(word, phrasePool);
      }
      tokenMeta.set(word, {
        pinyin: token.pinyin ?? "",
        gloss_pt: shortGloss(token.pt),
        dificil: !!token.dificil,
        nivel: phrase.nivel ?? 1,
      });
    }
  }
  return { tokenPool, tokenMeta };
}

function loadConsolidadoVocab() {
  const consolidado = readJson(CONSOLIDADO);
  const out = [];
  for (const block of consolidado.blocks ?? []) {
    for (const v of block.vocabulary ?? []) {
      if (!isQuizCandidate(v.hanzi)) continue;
      out.push({
        hanzi: v.hanzi,
        pinyin: v.pinyin ?? "",
        gloss_pt: shortGloss(v.translation),
        block: block.id,
        source: "consolidado",
      });
    }
  }
  return out;
}

function loadVocabBasicoEntries() {
  const vb = readJson(VOCAB_BASICO);
  const out = [];
  for (const e of vb.entries ?? []) {
    if (!e.hanzi || !isQuizCandidate(e.hanzi)) continue;
    out.push({
      hanzi: e.hanzi,
      pinyin: e.pinyin ?? "",
      gloss_pt: shortGloss(e.gloss_pt),
      block: e.hsk1 ? 1 : 98,
      source: "vocab-basico",
      hsk1: !!e.hsk1,
    });
  }
  return out;
}

function loadBookVocab() {
  const out = [];
  for (const [bookId, blockBase] of [
    ["primary-up", 30],
    ["primary-down", 50],
  ]) {
    const dir = join(BOOKS_CURATED, bookId);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
      const lesson = readJson(join(dir, file));
      const lessonNum = lesson.meta?.lesson ?? 0;
      for (const group of Object.values(lesson.byLessonSource ?? {})) {
        if (!Array.isArray(group)) continue;
        for (const row of group) {
          if (!row.hanzi || !isQuizCandidate(row.hanzi)) continue;
          out.push({
            hanzi: row.hanzi,
            pinyin: row.pinyin ?? "",
            gloss_pt: "",
            gloss_en: shortGloss(String(row.glossEn ?? "").replace(/[\u4e00-\u9fff]+.*$/, "")),
            block: blockBase + lessonNum,
            source: `book:${bookId}`,
          });
        }
      }
    }
  }
  return out;
}

function loadContextDeckVocab() {
  const out = [];
  if (!existsSync(CONTEXT_DECKS)) return out;
  for (const file of readdirSync(CONTEXT_DECKS).filter((f) => f.endsWith(".json"))) {
    const deck = readJson(join(CONTEXT_DECKS, file));
    const block = deck.id?.includes("cozinha") ? 23 : 91;
    for (const card of deck.cards ?? []) {
      const hanzi = card.word ?? card.hanzi;
      if (!hanzi || !isQuizCandidate(hanzi)) continue;
      out.push({
        hanzi,
        pinyin: card.pinyin ?? "",
        gloss_pt: shortGloss(card.meaning ?? card.translation ?? ""),
        gloss_en: shortGloss(card.meaning ?? ""),
        block,
        source: `deck:${deck.id ?? file}`,
      });
    }
  }
  return out;
}

function mergeVocabEntries(lists) {
  const byHanzi = new Map();
  for (const list of lists) {
    for (const row of list) {
      const prev = byHanzi.get(row.hanzi);
      if (!prev) {
        byHanzi.set(row.hanzi, { ...row });
        continue;
      }
      byHanzi.set(row.hanzi, {
        ...prev,
        pinyin: prev.pinyin || row.pinyin,
        gloss_pt: prev.gloss_pt || row.gloss_pt,
        gloss_en: prev.gloss_en || row.gloss_en,
        block: prev.block ?? row.block,
        source: prev.source ?? row.source,
        hsk1: prev.hsk1 || row.hsk1,
        phrasePool: prev.phrasePool ?? row.phrasePool,
        dificil: prev.dificil || row.dificil,
        nivel: Math.max(prev.nivel ?? 1, row.nivel ?? 1),
      });
    }
  }
  return [...byHanzi.values()]
    .map((v) => ({
      ...v,
      gloss_pt: v.gloss_pt || v.gloss_en || "",
    }))
    .filter((v) => v.gloss_pt);
}

function assignVocabPool(entry, hsk1Set) {
  if (entry.phrasePool) return entry.phrasePool;

  const hanzi = entry.hanzi;
  const chars = [...hanzi];
  const wordHsk1 = hsk1Set.has(hanzi) || entry.hsk1;
  const tokens = chars.map((h) => ({
    dificil: entry.dificil ?? !(wordHsk1 || hsk1Set.has(h)),
  }));
  const allHsk1 = wordHsk1 || (chars.length > 0 && chars.every((h) => hsk1Set.has(h)));
  return assignPhrasePool(
    { tier: allHsk1 ? "hsk1" : "basico", nivel: entry.nivel ?? 1 },
    tokens.length ? tokens : [{ dificil: !allHsk1 }],
  );
}

function buildGlossLookup(curated, vocab, bookEn) {
  const pt = new Map();
  const en = new Map();
  const es = new Map();

  for (const v of vocab) {
    if (v.gloss_pt) pt.set(v.hanzi, v.gloss_pt);
    if (v.gloss_en) en.set(v.hanzi, v.gloss_en);
  }

  for (const q of curated) {
    if (q.type === "multiple_choice" && typeof q.correct === "number") {
      pt.set(q.hanzi, q.options_pt?.[q.correct] ?? pt.get(q.hanzi) ?? "");
      en.set(q.hanzi, q.options_en?.[q.correct] ?? en.get(q.hanzi) ?? "");
      es.set(q.hanzi, q.options_es?.[q.correct] ?? es.get(q.hanzi) ?? "");
    }
    if (q.type === "fill_blank" || q.type === "translation") {
      if (q.correct_answer_pt) pt.set(q.hanzi, q.correct_answer_pt);
      if (q.correct_answer_en) en.set(q.hanzi, q.correct_answer_en);
      if (q.correct_answer_es) es.set(q.hanzi, q.correct_answer_es);
    }
  }

  for (const [hanzi, gloss] of bookEn) {
    if (!en.has(hanzi)) en.set(hanzi, gloss);
  }

  return { pt, en, es };
}

function glossFor(locale, hanzi, lookup, fallback) {
  const map = lookup[locale];
  const fromMap = map.get(hanzi);
  if (fromMap) return fromMap;
  if (locale === "pt") return fallback.gloss_pt ?? "";
  if (locale === "en") return lookup.en.get(hanzi) ?? lookup.pt.get(hanzi) ?? fallback.gloss_en ?? "";
  return lookup.es.get(hanzi) ?? lookup.en.get(hanzi) ?? lookup.pt.get(hanzi) ?? "";
}

function pickDistractors(pool, correctHanzi, correctGloss, getGloss, count) {
  const candidates = deterministicSort(
    pool.filter(
      (v) => v.hanzi !== correctHanzi && getGloss(v) && getGloss(v).toLowerCase() !== correctGloss.toLowerCase(),
    ),
    (v) => v.hanzi,
  );
  const picked = [];
  const used = new Set([correctGloss.toLowerCase()]);
  for (const v of candidates) {
    const gloss = getGloss(v);
    const key = gloss.toLowerCase();
    if (used.has(key)) continue;
    used.add(key);
    picked.push(v);
    if (picked.length >= count) break;
  }
  return picked;
}

function buildMcQuestion(id, vocab, allVocab, lookup) {
  const { hanzi, pinyin, block, source } = vocab;
  const ptCorrect = glossFor("pt", hanzi, lookup, vocab);
  const enCorrect = glossFor("en", hanzi, lookup, vocab);
  const esCorrect = glossFor("es", hanzi, lookup, vocab);
  if (!ptCorrect) return null;

  const getPt = (v) => glossFor("pt", v.hanzi, lookup, v);
  const getEn = (v) => glossFor("en", v.hanzi, lookup, v);
  const getEs = (v) => glossFor("es", v.hanzi, lookup, v);

  const ptDistractors = pickDistractors(allVocab, hanzi, ptCorrect, getPt, OPTIONS_COUNT - 1);
  const enDistractors = pickDistractors(allVocab, hanzi, enCorrect || ptCorrect, getEn, OPTIONS_COUNT - 1);
  const esDistractors = pickDistractors(allVocab, hanzi, esCorrect || ptCorrect, getEs, OPTIONS_COUNT - 1);

  const options_pt = [ptCorrect, ...ptDistractors.map(getPt)].slice(0, OPTIONS_COUNT);
  const options_en = [enCorrect || ptCorrect, ...enDistractors.map(getEn)].slice(0, OPTIONS_COUNT);
  const options_es = [esCorrect || ptCorrect, ...esDistractors.map(getEs)].slice(0, OPTIONS_COUNT);

  if (options_pt.length < OPTIONS_COUNT) return null;

  const order = deterministicSort(
    [0, 1, 2].map((i) => ({ i })),
    (x) => `${hanzi}:${x.i}`,
  ).map((x) => x.i);
  const shuffleOptions = (opts) => order.map((i) => opts[i]);
  const shuffledPt = shuffleOptions(options_pt);
  const shuffledEn = shuffleOptions(options_en);
  const shuffledEs = shuffleOptions(options_es);
  const correct = shuffledPt.indexOf(ptCorrect);

  return {
    id,
    type: "multiple_choice",
    difficulty: 1,
    block,
    topic: source?.startsWith("book:") ? "book" : source?.startsWith("deck:") ? "deck" : "vocab",
    hanzi,
    pinyin: pinyin ?? "",
    question_pt: `Qual é o significado de ${hanzi}?`,
    question_en: `What is the meaning of ${hanzi}?`,
    question_es: `¿Cuál es el significado de ${hanzi}?`,
    options_pt: shuffledPt,
    options_en: shuffledEn,
    options_es: shuffledEs,
    correct,
    explanation_pt: `${hanzi} significa "${ptCorrect}".`,
    explanation_en: `${hanzi} means "${enCorrect || ptCorrect}".`,
    explanation_es: `${hanzi} significa "${esCorrect || ptCorrect}".`,
    generated: true,
  };
}

function selectStratified(candidates, reservedHanzi) {
  const byPool = { hsk1: [], hsk2: [], hsk2plus: [], hsk3: [] };
  for (const c of candidates) {
    if (reservedHanzi.has(c.hanzi)) continue;
    byPool[c.pool]?.push(c);
  }

  const selected = [];
  const seen = new Set();

  for (const [pool, target] of Object.entries(POOL_TARGETS)) {
    const list = deterministicSort(byPool[pool], (c) => c.hanzi);
    let added = 0;
    for (const c of list) {
      if (added >= target || seen.has(c.hanzi)) continue;
      selected.push(c);
      seen.add(c.hanzi);
      added += 1;
    }
  }

  if (selected.length < TARGET_GENERATED) {
    const rest = deterministicSort(
      candidates.filter((c) => !reservedHanzi.has(c.hanzi) && !seen.has(c.hanzi)),
      (c) => c.hanzi,
    );
    for (const c of rest) {
      if (selected.length >= TARGET_GENERATED) break;
      selected.push(c);
      seen.add(c.hanzi);
    }
  }

  return selected.slice(0, TARGET_GENERATED);
}

function loadBookGlossEn() {
  const map = new Map();
  for (const row of loadBookVocab()) {
    if (row.gloss_en) map.set(row.hanzi, row.gloss_en);
  }
  return map;
}

function cumulativeCounts(questions) {
  const exclusive = { hsk1: 0, hsk2: 0, hsk2plus: 0, hsk3: 0 };
  for (const q of questions) exclusive[q.pool] = (exclusive[q.pool] ?? 0) + 1;
  return {
    exclusive,
    cumulative: {
      hsk1: exclusive.hsk1,
      hsk2: exclusive.hsk1 + exclusive.hsk2,
      hsk2plus: exclusive.hsk1 + exclusive.hsk2 + exclusive.hsk2plus,
      hsk3: questions.length,
    },
  };
}

function main() {
  const bank = readJson(BANK_PATH);
  const vocabBasico = readJson(VOCAB_BASICO);
  const hsk1Set = loadHsk1Set(vocabBasico);
  const { tokenPool, tokenMeta } = loadPhraseTokenData();

  const phraseRows = [];
  for (const [hanzi, pool] of tokenPool) {
    if (!isQuizCandidate(hanzi)) continue;
    const meta = tokenMeta.get(hanzi) ?? {};
    phraseRows.push({
      hanzi,
      pinyin: meta.pinyin ?? "",
      gloss_pt: meta.gloss_pt ?? "",
      block: 90,
      source: "phrase-game",
      phrasePool: pool,
      dificil: meta.dificil,
      nivel: meta.nivel ?? 1,
    });
  }

  const allVocab = mergeVocabEntries([
    loadConsolidadoVocab(),
    loadVocabBasicoEntries(),
    loadBookVocab(),
    loadContextDeckVocab(),
    phraseRows,
  ]);

  const curated = (bank.questions ?? []).filter((q) => !q.generated);
  const reservedHanzi = new Set(curated.map((q) => q.hanzi).filter(Boolean));

  const candidates = allVocab.map((v) => ({
    ...v,
    pool: assignVocabPool(v, hsk1Set),
  }));

  const selected = selectStratified(candidates, reservedHanzi);
  const lookup = buildGlossLookup(curated, allVocab, loadBookGlossEn());

  const generated = [];
  let nextId = Math.max(0, ...curated.map((q) => q.id), 0) + 1;
  for (const v of selected) {
    const q = buildMcQuestion(nextId, v, allVocab, lookup);
    if (!q) continue;
    generated.push({ ...q, pool: v.pool });
    nextId += 1;
  }

  const questions = [
    ...curated.map((q) => ({ ...q, pool: q.pool ?? assignVocabPool({ hanzi: q.hanzi, nivel: q.difficulty }, hsk1Set) })),
    ...generated,
  ];

  const blocks_covered = [...new Set(questions.map((q) => q.block).filter(Boolean))].sort(
    (a, b) => a - b,
  );
  const pools = cumulativeCounts(questions);

  const out = {
    ...bank,
    metadata: {
      ...bank.metadata,
      total_questions: questions.length,
      target_question_count: TARGET_GENERATED + curated.length,
      unique_vocab: new Set(questions.map((q) => q.hanzi).filter(Boolean)).size,
      blocks_covered,
      pool_exclusive: pools.exclusive,
      pool_cumulative: pools.cumulative,
    },
    questions,
  };

  writeFileSync(BANK_PATH, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  console.log(
    `[quiz-bank] ${questions.length} questions (${curated.length} curated + ${generated.length} generated)`,
  );
  console.log("[quiz-bank] unique hanzi:", out.metadata.unique_vocab);
  console.log("[quiz-bank] pool exclusive:", pools.exclusive);
  console.log("[quiz-bank] pool cumulative:", pools.cumulative);
  console.log("[quiz-bank] vocab candidates:", allVocab.length);
}

main();
