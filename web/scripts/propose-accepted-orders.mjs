#!/usr/bin/env node
/**
 * Propose alternative word orders for the phrase game (`respostasAceitas`).
 *
 * The game compares the player's answer against ONE canonical string, so a
 * grammatically valid reordering is marked wrong — and now costs points. Today
 * not a single phrase in the bank lists an alternative.
 *
 * This script only ever writes a REVIEW file. Nothing reaches the bank without a
 * human setting `approved: true` and running `apply-accepted-orders.mjs`.
 *
 *   node scripts/propose-accepted-orders.mjs              # what would be sent
 *   node scripts/propose-accepted-orders.mjs --llm        # ask LLM_API_URL
 *   node scripts/propose-accepted-orders.mjs --llm --limit 40 --batch 10
 *
 * Every LLM suggestion is checked mechanically before it is written down: it
 * must be a reordering of exactly the pieces the player is given. Suggestions
 * that invent, drop or alter a character are dropped with a reason.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkAcceptedOrder } from "./accepted-orders-lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(__dirname, "..");
const REPO_ROOT = join(WEB_ROOT, "..");
const BANK = join(WEB_ROOT, "src", "data", "phrase-game", "phrases.json");
const OUT = join(REPO_ROOT, "FRASES_GAME", "curated", "pending-accepted-orders.json");

const argv = process.argv.slice(2);
const wantLlm = argv.includes("--llm");
const numberArg = (name, fallback) => {
  const i = argv.indexOf(name);
  if (i === -1) return fallback;
  const n = Number.parseInt(argv[i + 1] ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};
const limit = numberArg("--limit", Infinity);
const batchSize = numberArg("--batch", 15);

/** Two-piece phrases have no room for a meaningful alternative. */
const MIN_PIECES = 3;

function loadCandidates() {
  const bank = JSON.parse(readFileSync(BANK, "utf8"));
  return bank.phrases
    .filter((p) => p.tokens.length >= MIN_PIECES)
    .filter((p) => !(p.respostasAceitas?.length > 0))
    .slice(0, limit === Infinity ? undefined : limit)
    .map((p) => ({
      id: p.id,
      hanzi: p.hanzi,
      pt: p.pt,
      pieces: p.tokens.map((t) => t.palavra),
    }));
}

function buildPrompt(batch) {
  const lines = batch
    .map(
      (p) =>
        `- id=${p.id} | canonical=${p.hanzi} | pieces=[${p.pieces.join(" | ")}] | meaning=${p.pt}`,
    )
    .join("\n");
  return [
    "You are checking word-order variants for a Chinese sentence-building GAME.",
    "The player is given a fixed set of word pieces and must arrange them.",
    "This is a pedagogical exercise, not a corpus of every possible Chinese utterance.",
    "",
    "Generate an alternative ONLY when it is a standard, neutral, independently",
    "teachable Mandarin structure — the kind that would appear in a textbook as a",
    "normal grammatical pattern. Do not enumerate every order a native speaker",
    "could understand in some conversational context.",
    "",
    "An alternative must preserve:",
    "- the same grammatical relationships;",
    "- the same basic meaning;",
    "- the same register;",
    "- the same information structure as much as possible;",
    "- all constituent boundaries.",
    "",
    "Do not generate discourse-dependent alternatives. Reject anything that needs",
    "contrast, topicalization, special emphasis, ellipsis, a preceding sentence,",
    "unusual intonation, or a spoken/colloquial context to sound natural.",
    "",
    "Examples:",
    "- From 我喝茶 do NOT generate 茶我喝. 茶，我喝 is a contrastive topic, not a",
    "  normal beginner word-order variant. Do not front objects just because",
    "  Chinese allows topic-comment.",
    "- 你今天下午忙吗 and 今天下午你忙吗 ARE both standard (time block may move",
    "  before/after the subject as a unit).",
    "- Do NOT generate 你下午今天忙吗 — 今天下午 has an internal order; never split it.",
    "- Never split expressions such as 一家非常大的公司, 今天下午, 在学校.",
    "- Do not front location phrases, objects, complements, or modifiers merely",
    "  because the result could theoretically be interpreted.",
    "",
    "If an alternative is grammatical only under a special conversational reading,",
    "exclude it. If there is doubt whether a variant is neutral or marked, exclude it.",
    "Prefer ZERO alternatives over a questionable one. Do not try to maximize count.",
    "The expected number of alternatives is often zero.",
    "",
    "Rules:",
    "- Use every piece exactly once. Never add, drop, split, merge or alter a piece.",
    "- Never list an ordering that changes who does what to whom.",
    "- Output valid pedagogical permutations only — not creative rewrites,",
    "  colloquial variants, rhetorical structures, or topic-comment transformations.",
    "",
    'Reply with JSON only: [{"id":"pg-001","alternatives":["…"],"reason":"…"}]',
    'Use "reason" to say briefly why the alternatives work, or why there are none.',
    "",
    "Sentences:",
    lines,
  ].join("\n");
}

async function askLlm(batch) {
  const LLM_API_URL = process.env.LLM_API_URL || "http://127.0.0.1:28471";
  const LLM_API_TOKEN = process.env.LLM_API_TOKEN;
  const headers = { "Content-Type": "application/json" };
  if (LLM_API_TOKEN) headers.Authorization = `Bearer ${LLM_API_TOKEN}`;

  const response = await fetch(`${LLM_API_URL}/edu/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      message: buildPrompt(batch),
      history: [],
      level: "HSK1",
      language: "zh-CN",
      model: process.env.LLM_ACCEPTED_ORDERS_MODEL?.trim() || "smart",
    }),
  });
  if (!response.ok) {
    throw new Error(`LLM HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
  const payload = await response.json();
  const text =
    typeof payload === "string" ? payload : (payload.reply ?? payload.message ?? payload.content ?? "");
  const match = String(text).match(/\[[\s\S]*\]/);
  if (!match) throw new Error(`No JSON array in LLM reply: ${String(text).slice(0, 200)}`);
  return JSON.parse(match[0]);
}

function main() {
  const candidates = loadCandidates();
  console.log(`[accepted-orders] ${candidates.length} phrases with >= ${MIN_PIECES} pieces and no alternatives yet`);

  if (!wantLlm) {
    console.log(`[accepted-orders] dry run — prompt for the first batch of ${batchSize}:\n`);
    console.log(buildPrompt(candidates.slice(0, batchSize)));
    console.log(`\n[accepted-orders] re-run with --llm to query ${process.env.LLM_API_URL || "LLM_API_URL"}.`);
    return;
  }

  run(candidates).catch((err) => {
    console.error(`[accepted-orders] ${err.message}`);
    process.exit(1);
  });
}

/**
 * Decisions already made, keyed by id+alternative. A re-run must never silently
 * throw away someone's review work.
 */
function previousDecisions() {
  if (!existsSync(OUT)) return new Map();
  try {
    const old = JSON.parse(readFileSync(OUT, "utf8"));
    return new Map(
      (old.proposals ?? []).map((p) => [`${p.id}\u0000${p.alternative}`, p]),
    );
  } catch {
    return new Map();
  }
}

async function run(candidates) {
  const byId = new Map(candidates.map((c) => [c.id, c]));
  const previous = previousDecisions();
  const proposals = [];
  const rejected = [];

  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    process.stdout.write(
      `[accepted-orders] batch ${i / batchSize + 1}/${Math.ceil(candidates.length / batchSize)}… `,
    );
    let rows;
    try {
      rows = await askLlm(batch);
    } catch (err) {
      console.log(`failed: ${err.message}`);
      continue;
    }

    let kept = 0;
    for (const row of Array.isArray(rows) ? rows : []) {
      const phrase = byId.get(row?.id);
      if (!phrase) continue;
      const seen = [];
      for (const alternative of Array.isArray(row.alternatives) ? row.alternatives : []) {
        const verdict = checkAcceptedOrder(alternative, {
          hanzi: phrase.hanzi,
          pieces: phrase.pieces,
          existing: seen,
        });
        if (!verdict.ok) {
          rejected.push({ id: phrase.id, alternative, reason: verdict.reason });
          continue;
        }
        seen.push(alternative);
        const earlier = previous.get(`${phrase.id}\u0000${alternative}`);
        proposals.push({
          id: phrase.id,
          hanzi: phrase.hanzi,
          pt: phrase.pt,
          pieces: phrase.pieces,
          alternative,
          reason: typeof row.reason === "string" ? row.reason.slice(0, 300) : "",
          // A human sets this to true. Anything else is ignored on apply.
          approved: earlier ? earlier.approved : null,
        });
        previous.delete(`${phrase.id}\u0000${alternative}`);
        kept += 1;
      }
    }
    console.log(`${kept} kept`);
  }

  // Anything reviewed before that this run did not re-propose is kept, so an
  // approval is never lost by re-running against a different --limit.
  const carried = [...previous.values()];
  const all = [...proposals, ...carried];
  const decided = all.filter((p) => p.approved !== null).length;

  writeFileSync(
    OUT,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        note: 'Review each entry and set "approved": true to accept it. Then run: node scripts/apply-accepted-orders.mjs',
        approved: all.filter((p) => p.approved === true).length,
        pending: all.length - decided,
        proposals: all,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log(
    `\n[accepted-orders] ${proposals.length} proposals` +
      (carried.length > 0 ? `, ${carried.length} earlier decision(s) kept` : "") +
      ` → ${OUT}`,
  );
  if (rejected.length > 0) {
    console.log(`[accepted-orders] ${rejected.length} suggestions dropped as invalid:`);
    for (const r of rejected.slice(0, 10)) {
      console.log(`   ${r.id}: "${r.alternative}" — ${r.reason}`);
    }
    if (rejected.length > 10) console.log(`   … and ${rejected.length - 10} more`);
  }
  console.log("[accepted-orders] nothing was written to the bank — approve first.");
}

main();
