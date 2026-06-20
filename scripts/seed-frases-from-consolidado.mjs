#!/usr/bin/env node
/**
 * Seed FRASES_GAME from consolidado structures (no LLM, no dialogues).
 * Usage: node scripts/seed-frases-from-consolidado.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const FRASES = path.join(ROOT, "FRASES_GAME");
const DIALOGUE_RE = /[：:]|^[AB]\s*[：:]/;
const PUNCT = /[，。！？、；：""''\s]/g;

function loadVocab() {
  const data = JSON.parse(
    fs.readFileSync(path.join(ROOT, "vocabulario/vocab-basico.json"), "utf8"),
  );
  const set = new Set(data.entries.map((e) => e.hanzi));
  const gloss = new Map(data.entries.filter((e) => e.gloss_pt).map((e) => [e.hanzi, e.gloss_pt]));
  const pinyinMap = new Map(data.entries.filter((e) => e.pinyin).map((e) => [e.hanzi, e.pinyin]));
  return { set, gloss, pinyinMap };
}

function segmentHanzi(hanzi, vocabSet) {
  const tokens = [];
  let i = 0;
  while (i < hanzi.length) {
    let pick = hanzi[i];
    for (let len = Math.min(6, hanzi.length - i); len >= 1; len--) {
      const sub = hanzi.slice(i, i + len);
      if (vocabSet.has(sub) || len === 1) {
        pick = sub;
        break;
      }
    }
    tokens.push(pick);
    i += pick.length;
  }
  return tokens;
}

function charPinyin(word, wordPinyin) {
  if (!wordPinyin) return word.split("").map((h) => ({ hanzi: h, pinyin: "" }));
  const syllables = wordPinyin.trim().split(/\s+/);
  if (syllables.length === word.length) {
    return word.split("").map((h, i) => ({ hanzi: h, pinyin: syllables[i] }));
  }
  return [{ hanzi: word, pinyin: wordPinyin }];
}

function inferNivel(tokenCount, isQuestion) {
  if (isQuestion) return 4;
  if (tokenCount <= 3) return 1;
  if (tokenCount <= 6) return 2;
  if (tokenCount <= 9) return 3;
  return 4;
}

function pickDistractors(tokenSet, vocab, count = 3) {
  const pool = [...vocab.set].filter((w) => w.length <= 3 && !tokenSet.has(w));
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((hanzi) => ({
    hanzi,
    pinyin: vocab.pinyinMap.get(hanzi) ?? "",
    pt: vocab.gloss.get(hanzi) ?? hanzi,
  }));
}

function buildPhrase(hanzi, pinyin, vocab) {
  const clean = hanzi.replace(PUNCT, "");
  if (!clean || DIALOGUE_RE.test(hanzi)) return null;
  const words = segmentHanzi(clean, vocab.set);
  const pinyinParts = (pinyin ?? "").split(/\s+/).filter(Boolean);
  let pi = 0;
  const tokens = words.map((palavra) => {
    const chunk = pinyinParts.slice(pi, pi + palavra.length).join(" ");
    pi += palavra.length;
    return {
      palavra,
      caracteres: charPinyin(palavra, chunk || vocab.pinyinMap.get(palavra)),
      pinyin: chunk || vocab.pinyinMap.get(palavra) || "",
      pt: vocab.gloss.get(palavra) ?? "",
      dificil: palavra.length > 2 && !vocab.gloss.has(palavra),
    };
  });
  const tokenSet = new Set(words);
  const isQuestion = /[吗？]|什么|哪里|哪儿|怎么|多少|几|谁|哪/.test(clean);
  const nivel = inferNivel(tokens.length, isQuestion);
  return {
    nivel,
    pt: "",
    hanzi: clean,
    pinyin: pinyinParts.join(" ") || pinyin || "",
    tokens,
    distratores: pickDistractors(tokenSet, vocab, 3),
    tags: ["seed:consolidado"],
  };
}

function main() {
  const vocab = loadVocab();
  const { blocks } = JSON.parse(
    fs.readFileSync(path.join(ROOT, "web/src/data/consolidado.json"), "utf8"),
  );
  const byNivel = { 1: [], 2: [], 3: [], 4: [] };
  const seen = new Set();

  for (const block of blocks) {
    for (const s of block.structures ?? []) {
      const hz = s.hanzi.replace(PUNCT, "");
      if (!hz || seen.has(hz) || DIALOGUE_RE.test(s.hanzi)) continue;
      const phrase = buildPhrase(s.hanzi, s.pinyin, vocab);
      if (!phrase) continue;
      seen.add(hz);
      byNivel[phrase.nivel].push(phrase);
    }
  }

  for (const [nivel, phrases] of Object.entries(byNivel)) {
    const dir = path.join(FRASES, `Nivel${nivel}`);
    fs.mkdirSync(dir, { recursive: true });
    phrases.forEach((p, i) => {
      p.id = `n${nivel}-seed-${String(i + 1).padStart(3, "0")}`;
    });
    const out = path.join(dir, `nivel${nivel}-seed.json`);
    fs.writeFileSync(
      out,
      `${JSON.stringify({ version: 1, source: "consolidado", nivel: Number(nivel), count: phrases.length, phrases }, null, 2)}\n`,
      "utf8",
    );
    console.log(`Nivel ${nivel}: ${phrases.length} seed phrases → ${out}`);
  }
}

main();
