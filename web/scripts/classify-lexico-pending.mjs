#!/usr/bin/env node
/**
 * Lexico pending helper (Mac / site ops).
 *
 *   node scripts/classify-lexico-pending.mjs           # list pending
 *   node scripts/classify-lexico-pending.mjs --llm     # call site LLM (needs LLM_API_URL up)
 *
 * Does NOT write assignments automatically. Paste/review into
 * lexico-category-assignments.mjs, then:
 *   LEXICO_REBUILD=1 npm run seed:content
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { MAX_HANZI_LENGTH, ROTATION_CATEGORIES } from "./lexico-rotation-config.mjs";
import { LEXICO_CATEGORY_ASSIGNMENTS } from "./lexico-category-assignments.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dbPath =
  process.env.SITE_DB ||
  path.join(root, "data", "phrase-game.sqlite");

const wantLlm = process.argv.includes("--llm");

function listPending(db) {
  const inLexico = new Set(
    db.prepare(`SELECT hanzi FROM lexico_entries`).all().map((r) => r.hanzi),
  );
  const assigned = new Set(Object.keys(LEXICO_CATEGORY_ASSIGNMENTS));
  const byHanzi = new Map();

  const push = (hanzi, pinyin, translation, from) => {
    hanzi = (hanzi || "").trim();
    pinyin = (pinyin || "").trim();
    translation = (translation || "").trim();
    if (!hanzi || !pinyin || !translation) return;
    if ([...hanzi].length > MAX_HANZI_LENGTH) return;
    if (inLexico.has(hanzi)) return;
    if (assigned.has(hanzi)) return;
    if (byHanzi.has(hanzi)) return;
    byHanzi.set(hanzi, { hanzi, pinyin, translation, from });
  };

  for (const row of db
    .prepare(`SELECT deck_id, word, pinyin, meaning FROM context_deck_cards`)
    .all()) {
    push(row.word, row.pinyin, row.meaning, `context:${row.deck_id}`);
  }
  try {
    for (const row of db
      .prepare(`SELECT hanzi, pinyin, translation FROM lexicon_global`)
      .all()) {
      push(row.hanzi, row.pinyin, row.translation, "lexicon_global");
    }
  } catch {
    /* optional */
  }
  return [...byHanzi.values()].sort((a, b) =>
    a.hanzi.localeCompare(b.hanzi, "zh"),
  );
}

async function classifyWithLlm(candidates) {
  const LLM_API_URL = process.env.LLM_API_URL || "http://127.0.0.1:28471";
  const LLM_API_TOKEN = process.env.LLM_API_TOKEN;
  const catalog = ROTATION_CATEGORIES.map(
    (c) => `- ${c.id}: ${c.title}`,
  ).join("\n");
  const lines = candidates
    .map(
      (c) =>
        `- hanzi=${c.hanzi} | pinyin=${c.pinyin} | meaning=${c.translation} | from=${c.from}`,
    )
    .join("\n");
  const message = [
    "Classify each Chinese word into exactly one rotation category for a flashcard/widget lexicon.",
    "Categories:",
    catalog,
    "Reply with JSON only: an array of {\"hanzi\":\"…\",\"rotationCategoryId\":\"…\",\"confidence\":0-1,\"rationale\":\"…\"}.",
    "Words:",
    lines,
  ].join("\n");

  const headers = { "Content-Type": "application/json" };
  if (LLM_API_TOKEN) headers.Authorization = `Bearer ${LLM_API_TOKEN}`;

  const response = await fetch(`${LLM_API_URL}/edu/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      message,
      history: [],
      level: "HSK1",
      language: "zh-CN",
      model: process.env.LLM_LEXICO_CLASSIFY_MODEL?.trim() || "smart",
    }),
  });
  if (!response.ok) {
    throw new Error(
      `LLM HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`,
    );
  }
  const payload = await response.json();
  console.log(JSON.stringify(payload, null, 2));
}

const db = new DatabaseSync(dbPath);
const pending = listPending(db);
console.log(
  `DB: ${dbPath}\nPending (in sources, ≤${MAX_HANZI_LENGTH}, not in lexico, no assignment): ${pending.length}`,
);
for (const p of pending) {
  console.log(`  ${p.hanzi}\t${p.pinyin}\t${p.translation}\t${p.from}`);
}

if (wantLlm) {
  if (pending.length === 0) {
    console.log("Nothing to classify with LLM.");
  } else {
    console.log("\nCalling LLM… (review output; do not auto-apply)");
    await classifyWithLlm(pending);
  }
} else {
  console.log(
    "\nTip: --llm to propose categories via LLM_API_URL (site/server). Then merge into lexico-category-assignments.mjs + LEXICO_REBUILD=1.",
  );
}
db.close();
