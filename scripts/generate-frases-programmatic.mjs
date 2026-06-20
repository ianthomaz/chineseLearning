#!/usr/bin/env node
/**
 * Fast programmatic phrase bank (~800) from vocab-basico + consolidado.
 * No dialogues. Fills FRASES_GAME until level targets met; LLM can refine later.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const FRASES = path.join(ROOT, "FRASES_GAME");
const TARGETS = { 1: 150, 2: 200, 3: 200, 4: 250 };

const PRONOUNS = ["我", "你", "他", "她", "我们"];
const ADJ = ["好", "大", "小", "忙", "饿", "贵", "便宜", "高兴", "漂亮", "红", "白"];
const NOUNS = ["书", "茶", "水", "家", "学校", "医院", "地图", "钱", "咖啡", "苹果", "米饭", "衣服", "衬衫", "桌子", "沙发", "床", "中国", "巴西"];
const VERBS = ["看", "吃", "喝", "买", "去", "来", "学习", "工作", "想", "有", "是", "喜欢"];
const PLACES = ["家", "学校", "医院", "商店"];
const TIME = ["今天", "明天", "现在", "下午", "上午"];
const Q = ["什么", "哪里", "怎么", "多少"];

const PT_PRONOUN = { 我: "Eu", 你: "Tu", 他: "Ele", 她: "Ela", 我们: "Nós" };
const PT_ADJ = {
  好: "bem", 大: "grande", 小: "pequeno", 忙: "ocupado", 饿: "com fome",
  贵: "caro", 便宜: "barato", 高兴: "feliz", 漂亮: "bonito", 红: "vermelho", 白: "branco",
};
const PT_NOUN = {
  书: "livro", 茶: "chá", 水: "água", 家: "casa", 学校: "escola", 医院: "hospital",
  地图: "mapa", 钱: "dinheiro", 咖啡: "café", 苹果: "maçã", 米饭: "arroz",
  衣服: "roupa", 衬衫: "camisa", 桌子: "mesa", 沙发: "sofá", 床: "cama",
  中国: "China", 巴西: "Brasil",
};
const PT_VERB = {
  看: "ver", 吃: "comer", 喝: "beber", 买: "comprar", 去: "ir", 来: "vir",
  学习: "estudar", 工作: "trabalhar", 想: "querer", 有: "ter", 是: "ser", 喜欢: "gostar de",
};

function glossPt(hanzi, vocab) {
  return vocab.get(hanzi)?.gloss_pt ?? PT_PRONOUN[hanzi] ?? PT_ADJ[hanzi] ?? PT_NOUN[hanzi] ?? PT_VERB[hanzi] ?? hanzi;
}

function buildPt(tokens) {
  const parts = tokens.map((t) => glossPt(t.palavra, { get: (k) => ({ gloss_pt: PT_PRONOUN[k] ?? PT_ADJ[k] ?? PT_NOUN[k] ?? PT_VERB[k] }) }));
  if (tokens.length === 3 && tokens[1].palavra === "很") {
    return `${PT_PRONOUN[tokens[0].palavra] ?? "Eu"} estou ${PT_ADJ[tokens[2].palavra] ?? tokens[2].pt}`;
  }
  if (tokens.length === 3 && tokens[1].palavra === "不") {
    return `${PT_PRONOUN[tokens[0].palavra] ?? "Eu"} não está ${PT_ADJ[tokens[2].palavra] ?? tokens[2].pt}`;
  }
  return parts.join(" ");
}

function loadVocab() {
  const { entries } = JSON.parse(
    fs.readFileSync(path.join(ROOT, "vocabulario/vocab-basico.json"), "utf8"),
  );
  const map = new Map(entries.map((e) => [e.hanzi, e]));
  return map;
}

function loadConsolidadoStructures() {
  const { blocks } = JSON.parse(
    fs.readFileSync(path.join(ROOT, "web/src/data/consolidado.json"), "utf8"),
  );
  const out = [];
  for (const b of blocks) {
    for (const s of b.structures ?? []) {
      const hz = s.hanzi.replace(/[，。！？、\s]/g, "");
      if (!hz || /[：:]/.test(s.hanzi)) continue;
      out.push({ hanzi: hz, pinyin: s.pinyin ?? "", pt: "" });
    }
  }
  return out;
}

function charPinyin(word, wordPy) {
  const syl = (wordPy || "").trim().split(/\s+/).filter(Boolean);
  if (syl.length === word.length) {
    return word.split("").map((h, i) => ({ hanzi: h, pinyin: syl[i] }));
  }
  return word.split("").map((h) => ({ hanzi: h, pinyin: "" }));
}

function segmentWords(hanzi, vocab) {
  const tokens = [];
  let i = 0;
  while (i < hanzi.length) {
    let pick = hanzi[i];
    for (let len = Math.min(4, hanzi.length - i); len >= 1; len--) {
      const sub = hanzi.slice(i, i + len);
      if (vocab.has(sub) || len === 1) {
        pick = sub;
        break;
      }
    }
    tokens.push(pick);
    i += pick.length;
  }
  return tokens;
}

function makeToken(palavra, vocab) {
  const e = vocab.get(palavra);
  const py = e?.pinyin ?? "";
  return {
    palavra,
    caracteres: charPinyin(palavra, py),
    pinyin: py,
    pt: e?.gloss_pt ?? palavra,
    dificil: palavra.length > 2 && !e?.gloss_pt,
  };
}

function pickDist(tokenSet, vocab) {
  const pool = [...vocab.values()].filter((e) => e.hanzi.length <= 2 && !tokenSet.has(e.hanzi));
  return pool
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((e) => ({ hanzi: e.hanzi, pinyin: e.pinyin || e.hanzi, pt: e.gloss_pt || e.hanzi }));
}

function inferNivel(tokenCount, isQ) {
  if (isQ) return 4;
  if (tokenCount <= 3) return 1;
  if (tokenCount <= 6) return 2;
  if (tokenCount <= 9) return 3;
  return 4;
}

function phraseFromHanzi(hanzi, pinyin, pt, vocab) {
  const words = segmentWords(hanzi.replace(/[，。！？、]/g, ""), vocab);
  const tokens = words.map((w) => makeToken(w, vocab));
  const tokenSet = new Set(words);
  const isQ = /[吗？]|什么|哪里|哪儿|怎么|多少|几|谁|哪/.test(hanzi);
  const nivel = inferNivel(tokens.length, isQ);
  const py =
    pinyin ||
    tokens
      .map((t) => t.pinyin)
      .filter(Boolean)
      .join(" ");
  return {
    nivel,
    pt: pt || buildPt(tokens),
    hanzi: hanzi.replace(/[，。！？、\s]/g, ""),
    pinyin: py,
    tokens,
    distratores: pickDist(tokenSet, vocab),
    tags: ["gen:programmatic"],
  };
}

function templates(vocab) {
  const out = [];
  const push = (hz, py, pt) => {
    const clean = hz.replace(/[，。！？、\s]/g, "");
    if (clean) out.push({ hanzi: clean, pinyin: py ?? "", pt: pt ?? "" });
  };

  for (const p of PRONOUNS) {
    for (const a of ADJ) {
      push(`${p}很${a}`, "", `${p} very ${a}`);
      push(`${p}不${a}`, "", `${p} not ${a}`);
    }
  }
  for (const p of PRONOUNS) {
    for (const v of VERBS) {
      for (const n of NOUNS) {
        push(`${p}${v}${n}`, "", "");
        push(`${p}想${v}${n}`, "", "");
        push(`${p}今天${v}${n}`, "", "");
      }
    }
  }
  for (const p of PRONOUNS) {
    for (const n1 of NOUNS) {
      for (const n2 of NOUNS) {
        if (n1 === n2) continue;
        push(`${p}有${n1}和${n2}`, "", "");
      }
    }
  }
  for (const t of TIME) {
    for (const p of PRONOUNS) {
      for (const v of VERBS) {
        for (const n of NOUNS) {
          push(`${t}${p}${v}${n}`, "", "");
          push(`${t}${p}想${v}${n}`, "", "");
        }
      }
    }
  }
  for (const loc of PLACES) {
    for (const p of PRONOUNS) {
      push(`${p}在${loc}`, "", "");
      push(`${p}去${loc}`, "", "");
      push(`${p}想在${loc}学习`, "", "");
      push(`${p}今天去${loc}学习`, "", "");
    }
  }
  for (const p of PRONOUNS) {
    for (const c of ["红", "白", "黑", "黄", "蓝", "绿"]) {
      for (const n of NOUNS) {
        for (const loc of PLACES) {
          push(`${p}买${c}色${n}`, "", "");
          push(`${c}色${n}在${loc}`, "", "");
        }
      }
    }
  }
  for (const loc of PLACES) {
    for (const p of PRONOUNS) {
      for (const c of ["红", "白", "黑", "黄"]) {
        for (const n of ["书", "衬衫", "苹果", "地图", "桌子"]) {
          push(`${c}色${n}在${loc}`, "", "");
        }
      }
    }
  }
  for (const p of PRONOUNS) {
    for (const q of Q) {
      push(`${p}想${q}`, "", "");
      push(`${p}今天想${q}`, "", "");
      push(`${p}想去${q}买书`, "", "");
      push(`${p}今天想去哪里买书`, "", "");
    }
  }
  for (const s of loadConsolidadoStructures()) out.push(s);
  return out;
}

function existingAll() {
  const seen = new Set();
  for (const n of Object.keys(TARGETS)) {
    const dir = path.join(FRASES, `Nivel${n}`);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
      for (const p of JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")).phrases ?? []) {
        if (p?.hanzi) seen.add(p.hanzi.replace(/\s/g, ""));
      }
    }
  }
  return seen;
}

function countByNivel() {
  const c = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const n of Object.keys(TARGETS)) {
    const f = path.join(FRASES, `Nivel${n}`, `nivel${n}.json`);
    if (fs.existsSync(f)) c[n] = JSON.parse(fs.readFileSync(f, "utf8")).count ?? 0;
    else {
      const dir = path.join(FRASES, `Nivel${n}`);
      if (fs.existsSync(dir)) {
        const seen = new Set();
        for (const file of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
          for (const p of JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")).phrases ?? []) {
            if (p?.hanzi) seen.add(p.hanzi);
          }
        }
        c[n] = seen.size;
      }
    }
  }
  return c;
}

function mergeNivel(nivel, phrases) {
  const dir = path.join(FRASES, `Nivel${nivel}`);
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, `nivel${nivel}.json`);
  phrases.forEach((p, i) => {
    p.id = `n${nivel}-${String(i + 1).padStart(3, "0")}`;
    p.nivel = Number(nivel);
  });
  fs.writeFileSync(
    out,
    `${JSON.stringify({ version: 1, nivel: Number(nivel), count: phrases.length, phrases }, null, 2)}\n`,
    "utf8",
  );
}

function main() {
  if (!fs.existsSync(path.join(ROOT, "vocabulario/vocab-basico.json"))) {
    throw new Error("Run node scripts/build-vocab-basico.mjs first");
  }
  const vocab = loadVocab();
  const seen = existingAll();
  const byNivel = { 1: [], 2: [], 3: [], 4: [] };

  for (const t of templates(vocab)) {
    const p = phraseFromHanzi(t.hanzi, t.pinyin, t.pt, vocab);
    const hz = p.hanzi;
    if (seen.has(hz) || hz.length < 2) continue;
    seen.add(hz);
    byNivel[p.nivel].push(p);
  }

  // Balance: fill each level to target using nivel reassignment if needed
  const all = [];
  for (const p of [...byNivel[1], ...byNivel[2], ...byNivel[3], ...byNivel[4]]) all.push(p);

  const buckets = { 1: [], 2: [], 3: [], 4: [] };
  for (const p of all) buckets[p.nivel].push(p);

  // Move overflow to levels that need fill
  for (const n of [1, 2, 3, 4]) {
    while (buckets[n].length > TARGETS[n]) {
      const extra = buckets[n].pop();
      for (const m of [1, 2, 3, 4]) {
        if (buckets[m].length < TARGETS[m]) {
          extra.nivel = m;
          buckets[m].push(extra);
          break;
        }
      }
    }
  }

  // If still short, duplicate variants with 吗 for nivel 4
  let i = 0;
  while (buckets[4].length < TARGETS[4] && i < all.length) {
    const base = all[i++ % all.length];
    const hz = base.hanzi.endsWith("吗") ? base.hanzi : `${base.hanzi}吗`;
    if (seen.has(hz)) continue;
    seen.add(hz);
    const p = phraseFromHanzi(hz, base.pinyin, `${base.pt}?`, vocab);
    p.nivel = 4;
    buckets[4].push(p);
  }

  let total = 0;
  for (const n of [1, 2, 3, 4]) {
    const list = buckets[n].slice(0, TARGETS[n]);
    mergeNivel(n, list);
    total += list.length;
    console.log(`Nivel ${n}: ${list.length} phrases`);
  }

  const merged = [];
  for (const n of [1, 2, 3, 4]) {
    merged.push(...JSON.parse(fs.readFileSync(path.join(FRASES, `Nivel${n}/nivel${n}.json`), "utf8")).phrases);
  }
  fs.writeFileSync(
    path.join(FRASES, "all-phrases.json"),
    `${JSON.stringify({ version: 1, count: merged.length, byLevel: { 1: buckets[1].length, 2: buckets[2].length, 3: buckets[3].length, 4: buckets[4].length }, phrases: merged }, null, 2)}\n`,
    "utf8",
  );
  console.log(`all-phrases.json: ${merged.length} total`);
}

main();
