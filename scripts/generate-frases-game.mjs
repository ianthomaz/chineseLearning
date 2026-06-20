#!/usr/bin/env node
/**
 * Generate phrase-game dataset via local LLM (POST /edu/chat).
 * No runtime LLM — output is static JSON under FRASES_GAME/.
 *
 * Usage (repo root):
 *   node scripts/build-vocab-basico.mjs
 *   node scripts/generate-frases-game.mjs --nivel 1 --count 10
 *   node scripts/generate-frases-game.mjs --nivel 1 --count 150 --batch-size 10
 *   node scripts/generate-frases-game.mjs --merge --nivel 1
 *
 * Env: web/.env + web/.env.local (LLM_API_URL, LLM_API_TOKEN)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const FRASES = path.join(ROOT, "FRASES_GAME");
const HANZI_RE = /[\u4e00-\u9fff\u3400-\u4dbf]/;
const DIALOGUE_RE = /[：:]|(?:^|\s)[A-Za-z\u4e00-\u9fff]{1,4}\s*[：:]/;

const LEVEL_SPEC = {
  1: {
    target: 150,
    tokens: "exactly 3 tokens (words)",
    style: "affirmative only, no questions, minimal SVO or S+adj",
    example: "我很高兴 / wǒ hěn gāoxìng / eu estou muito feliz",
  },
  2: {
    target: 200,
    tokens: "4 to 6 tokens",
    style: "affirmative; may include color, place, object, 在, 的",
    example: "红色的书在桌子上",
  },
  3: {
    target: 200,
    tokens: "6 to 9 tokens",
    style: "affirmative compound sentence",
    example: "今天我想买一本黄色的书",
  },
  4: {
    target: 250,
    tokens: "7 to 12 tokens",
    style: "one complete question sentence (吗/呢/什么/哪里/怎么/多少)",
    example: "你今天想去哪里买书？",
  },
};

function loadEnv() {
  for (const f of ["web/.env", "web/.env.local"]) {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split("\n")) {
      const m = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line.trim());
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag, def) => {
    const i = args.indexOf(flag);
    return i === -1 ? def : args[i + 1];
  };
  return {
    merge: args.includes("--merge"),
    all: args.includes("--all"),
    nivel: Number(get("--nivel", "1")),
    count: Number(get("--count", "10")),
    batchSize: Number(get("--batch-size", "8")),
    model: get("--model", process.env.OLLAMA_MODEL || "qwen2.5:7b-instruct"),
  };
}

function loadVocabPool() {
  const { entries } = JSON.parse(
    fs.readFileSync(path.join(ROOT, "vocabulario/vocab-basico.json"), "utf8"),
  );
  return entries;
}

function pickDistractors(tokenSet, pool, n = 3) {
  const shuffled = pool
    .filter((e) => e.hanzi.length <= 3 && !tokenSet.has(e.hanzi))
    .sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n).map((e) => ({
    hanzi: e.hanzi,
    pinyin: e.pinyin || e.hanzi,
    pt: e.gloss_pt || e.hanzi,
  }));
}

function repairPhrase(p, nivel) {
  if (!p?.hanzi || !p?.tokens?.length) return p;
  const tokenSet = new Set(p.tokens.map((t) => t.palavra));
  p.distratores = (p.distratores ?? []).filter((d) => d?.hanzi && !tokenSet.has(d.hanzi));
  if (p.distratores.length < 2) {
    p.distratores = pickDistractors(tokenSet, loadVocabPool(), 3);
  }
  if (!p.pt?.trim()) p.pt = p.tokens.map((t) => t.pt).filter(Boolean).join(" ") || p.hanzi;
  if (!p.pinyin?.trim()) p.pinyin = p.tokens.map((t) => t.pinyin).filter(Boolean).join(" ");
  for (const t of p.tokens) {
    if (!t.caracteres?.length) {
      t.caracteres = t.palavra.split("").map((h) => ({ hanzi: h, pinyin: "" }));
    }
    if (!t.pt) t.pt = t.palavra;
    if (t.dificil === undefined) t.dificil = false;
  }
  for (const d of p.distratores) {
    if (!d.pinyin) d.pinyin = d.hanzi;
    if (!d.pt) d.pt = d.hanzi;
  }
  p.nivel = nivel;
  return p;
}

function countNivel(nivel) {
  const dir = path.join(FRASES, `Nivel${nivel}`);
  if (!fs.existsSync(dir)) return 0;
  const seen = new Set();
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    for (const p of JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")).phrases ?? []) {
      if (p?.hanzi) seen.add(p.hanzi);
    }
  }
  return seen.size;
}

function vocabSample(n = 120) {
  const p = path.join(ROOT, "vocabulario/vocab-basico.json");
  if (!fs.existsSync(p)) throw new Error("Run node scripts/build-vocab-basico.mjs first");
  const { entries } = JSON.parse(fs.readFileSync(p, "utf8"));
  const withGloss = entries.filter((e) => e.gloss_pt || e.pinyin);
  const rest = entries.filter((e) => !withGloss.includes(e));
  const pick = [...withGloss.slice(0, 80), ...rest.slice(0, n - 80)].slice(0, n);
  return pick.map((e) => `${e.hanzi}${e.pinyin ? ` (${e.pinyin})` : ""}${e.gloss_pt ? ` = ${e.gloss_pt}` : ""}`).join("\n");
}

function existingHanzi(nivel) {
  const dir = path.join(FRASES, `Nivel${nivel}`);
  if (!fs.existsSync(dir)) return new Set();
  const seen = new Set();
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    for (const phrase of data.phrases ?? data) {
      if (phrase?.hanzi) seen.add(phrase.hanzi.replace(/\s/g, ""));
    }
  }
  return seen;
}

function extractJsonArray(text) {
  if (!text || typeof text !== "string") throw new Error("Empty LLM reply");

  // ```json ... ```
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    try {
      const parsed = JSON.parse(fence[1].trim());
      if (Array.isArray(parsed)) return parsed;
      if (parsed?.phrases && Array.isArray(parsed.phrases)) return parsed.phrases;
    } catch {
      /* fall through */
    }
  }

  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      /* try line-by-line objects */
    }
  }

  // Single object wrapped
  const objStart = text.indexOf("{");
  const objEnd = text.lastIndexOf("}");
  if (objStart !== -1 && objEnd > objStart) {
    try {
      const one = JSON.parse(text.slice(objStart, objEnd + 1));
      if (one.phrases) return one.phrases;
      if (one.hanzi && one.tokens) return [one];
    } catch {
      /* fall through */
    }
  }

  throw new Error(`No JSON array in LLM reply (len=${text.length}, preview=${text.slice(0, 200)})`);
}

async function callOllamaDirect(message, model) {
  const ollamaUrl = (process.env.OLLAMA_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
  const res = await fetch(`${ollamaUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL || model || "qwen2.5:14b-instruct",
      stream: false,
      format: "json",
      messages: [
        {
          role: "system",
          content:
            "You are a JSON dataset generator. Reply with a single JSON object: {\"phrases\":[...]}. No markdown. No conversation.",
        },
        { role: "user", content: message },
      ],
    }),
    signal: AbortSignal.timeout(300_000),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const raw = data.message?.content ?? "";
  fs.mkdirSync(FRASES, { recursive: true });
  fs.writeFileSync(path.join(FRASES, "debug-last-reply.txt"), raw, "utf8");
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.phrases)) return parsed.phrases;
  if (parsed.hanzi && parsed.tokens) return [parsed];
  throw new Error("Ollama JSON missing phrases array");
}

async function callLlm(message, model, retry = true) {
  // Prefer raw Ollama (no tutor persona). Fallback: /edu/chat (usually wrong for bulk JSON).
  try {
    return await callOllamaDirect(message, model);
  } catch (ollamaErr) {
    console.log(`  Ollama direct failed (${ollamaErr.message}); trying /edu/chat…`);
  }

  const url = (process.env.LLM_API_URL || "http://127.0.0.1:28471").replace(/\/$/, "");
  const token = process.env.LLM_API_TOKEN;
  if (!token) throw new Error("LLM_API_TOKEN missing in web/.env.local");

  const body = { message, level: "HSK1", language: "zh-CN", model };
  const res = await fetch(`${url}/edu/chat`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(300_000),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const raw = data.reply ?? data.full_reply_text ?? "";

  fs.mkdirSync(FRASES, { recursive: true });
  fs.writeFileSync(path.join(FRASES, "debug-last-reply.txt"), raw, "utf8");

  try {
    return extractJsonArray(raw);
  } catch (e) {
    if (!retry) throw e;
    console.log("  retry: asking model to fix JSON…");
    return callOllamaDirect(
      `Fix to valid JSON object {\"phrases\":[...]} only:\n${raw.slice(0, 12000)}`,
      model,
    );
  }
}

function tokenCount(phrase) {
  return phrase.tokens?.length ?? 0;
}

function validatePhrase(p, nivel) {
  if (!p?.hanzi || !p?.pt || !p?.pinyin || !Array.isArray(p.tokens) || !Array.isArray(p.distratores))
    return "missing fields";
  if (DIALOGUE_RE.test(p.hanzi) || DIALOGUE_RE.test(p.pt)) return "dialogue";
  if (!HANZI_RE.test(p.hanzi)) return "no hanzi";
  const joined = p.tokens.map((t) => t.palavra).join("");
  const norm = (s) => s.replace(/[，。！？、\s]/g, "");
  if (norm(joined) !== norm(p.hanzi)) return `tokens mismatch: ${joined} vs ${p.hanzi}`;
  if (p.distratores.length < 2 || p.distratores.length > 3) return "distractor count";
  for (const d of p.distratores) {
    if (!d.hanzi || !d.pinyin || !d.pt) return "bad distractor";
    if (p.tokens.some((t) => t.palavra === d.hanzi)) return "distractor in tokens";
  }
  const n = tokenCount(p);
  if (nivel === 1 && n !== 3) return `nivel1 wants 3 tokens, got ${n}`;
  if (nivel === 2 && (n < 4 || n > 6)) return `nivel2 wants 4-6 tokens, got ${n}`;
  if (nivel === 3 && (n < 6 || n > 9)) return `nivel3 wants 6-9 tokens, got ${n}`;
  if (nivel === 4 && (n < 7 || n > 12)) return `nivel4 wants 7-12 tokens, got ${n}`;
  return null;
}

function buildPrompt(nivel, batchSize, avoid) {
  const spec = LEVEL_SPEC[nivel];
  if (!spec) throw new Error(`Unknown nivel ${nivel}`);
  return `TASK: Output ONLY raw JSON. First character must be [. Last character must be ]. No markdown fences. No prose.

Generate a JSON object: {"phrases":[ ... ${batchSize} items ... ]}.

Each object schema:
{
  "nivel": ${nivel},
  "pt": "full sentence in Brazilian Portuguese",
  "hanzi": "full sentence without spaces",
  "pinyin": "full sentence pinyin with tone marks",
  "tokens": [
    {
      "palavra": "multi or single hanzi word",
      "caracteres": [{"hanzi":"X","pinyin":"x"}],
      "pinyin": "word pinyin",
      "pt": "word gloss PT",
      "dificil": false
    }
  ],
  "distratores": [
    {"hanzi":"...","pinyin":"...","pt":"..."},
    {"hanzi":"...","pinyin":"...","pt":"..."}
  ],
  "tags": ["tema:..."]
}

Level ${nivel} rules:
- ${spec.tokens}
- ${spec.style}
- Example pattern: ${spec.example}

STRICT rules:
- NO dialogues (no speaker names, no colon format, no 张三说)
- ONE standalone sentence per object
- Use mostly this basic vocabulary (HSK1 / course basic):
${vocabSample(100)}
- Classical grammar word order; unique natural sentences
- distractors: 2-3 plausible basic words NOT in the sentence; must not combine with answer tokens to form another valid sentence
- Mark 1-2 tokens as dificil:true per sentence if not HSK1 core
- Do NOT duplicate these hanzi (already in dataset):
${[...avoid].slice(0, 40).join("\n") || "(none yet)"}`;
}

function assignIds(phrases, nivel) {
  const base = countNivel(nivel);
  return phrases.map((p, i) => ({
    ...p,
    id: p.id ?? `n${nivel}-${String(base + i + 1).padStart(3, "0")}`,
    nivel,
  }));
}

function nextBatchPath(nivel) {
  const dir = path.join(FRASES, `Nivel${nivel}`);
  fs.mkdirSync(dir, { recursive: true });
  const existing = fs.readdirSync(dir).filter((f) => f.startsWith("batch-"));
  const n = existing.length + 1;
  return path.join(dir, `batch-${String(n).padStart(2, "0")}.json`);
}

async function generateBatch(nivel, batchSize, model) {
  const avoid = existingHanzi(nivel);
  const prompt = buildPrompt(nivel, batchSize, avoid);
  console.log(`→ LLM nivel ${nivel}, batch ${batchSize}…`);
  const raw = await callLlm(prompt, model);
  const valid = [];
  const rejected = [];
  for (const p of raw) {
    repairPhrase(p, nivel);
    const err = validatePhrase(p, nivel);
    const hz = p.hanzi?.replace(/\s/g, "");
    if (err) rejected.push({ hanzi: p.hanzi, err });
    else if (avoid.has(hz)) rejected.push({ hanzi: p.hanzi, err: "duplicate" });
    else {
      valid.push(p);
      avoid.add(hz);
    }
  }
  const outPath = nextBatchPath(nivel);
  const payload = {
    generated_at: new Date().toISOString(),
    nivel,
    model,
    phrases: assignIds(valid, nivel),
    rejected,
  };
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`  saved ${valid.length} ok, ${rejected.length} rejected → ${outPath}`);
  return valid.length;
}

function mergeNivel(nivel, opts = {}) {
  const dir = path.join(FRASES, `Nivel${nivel}`);
  if (!fs.existsSync(dir)) return 0;
  const all = [];
  const seen = new Set();
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json") && x !== `nivel${nivel}.json`)) {
    for (const p of JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")).phrases ?? []) {
      if (!seen.has(p.hanzi)) {
        seen.add(p.hanzi);
        all.push(p);
      }
    }
  }
  all.sort((a, b) => (a.id ?? "").localeCompare(b.id ?? ""));
  const out = path.join(dir, `nivel${nivel}.json`);
  fs.writeFileSync(
    out,
    `${JSON.stringify({ version: 1, nivel, count: all.length, phrases: all }, null, 2)}\n`,
    "utf8",
  );
  if (!opts.silent) console.log(`merge nivel ${nivel}: ${all.length} phrases → ${out}`);
  return all.length;
}

function mergeAll() {
  let total = 0;
  const byLevel = {};
  for (const n of Object.keys(LEVEL_SPEC)) {
    byLevel[n] = mergeNivel(Number(n));
    total += byLevel[n];
  }
  const phrases = [];
  for (const n of Object.keys(LEVEL_SPEC)) {
    const f = path.join(FRASES, `Nivel${n}`, `nivel${n}.json`);
    if (fs.existsSync(f)) phrases.push(...JSON.parse(fs.readFileSync(f, "utf8")).phrases);
  }
  fs.writeFileSync(
    path.join(FRASES, "all-phrases.json"),
    `${JSON.stringify({ version: 1, count: phrases.length, byLevel, phrases }, null, 2)}\n`,
    "utf8",
  );
  console.log(`all-phrases.json: ${phrases.length} total`);
  return total;
}

async function runUntilTarget(nivel, model, batchSize) {
  const target = LEVEL_SPEC[nivel].target;
  let attempts = 0;
  const maxAttempts = Math.ceil((target * 3) / batchSize);
  while (countNivel(nivel) < target && attempts < maxAttempts) {
    await generateBatch(nivel, batchSize, model);
    mergeNivel(nivel);
    attempts++;
    console.log(`  nivel ${nivel}: ${countNivel(nivel)}/${target}`);
  }
}

async function main() {
  loadEnv();
  const { merge, all, nivel, count, batchSize, model } = parseArgs();
  if (merge) {
    mergeAll();
    return;
  }
  if (all) {
    console.log("=== Generate ALL levels → ~800 phrases ===");
    for (const n of Object.keys(LEVEL_SPEC).map(Number)) {
      await runUntilTarget(n, model, batchSize);
    }
    mergeAll();
    return;
  }
  if (!LEVEL_SPEC[nivel]) throw new Error(`Invalid --nivel ${nivel}`);

  let remaining = count;
  let total = 0;
  while (remaining > 0) {
    const n = Math.min(batchSize, remaining);
    total += await generateBatch(nivel, n, model);
    remaining -= n;
    mergeNivel(nivel);
  }
  console.log(`Done nivel ${nivel}: ${total} new phrases accepted`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
