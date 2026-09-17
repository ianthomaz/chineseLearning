#!/usr/bin/env node
/**
 * Merge approved alternative word orders into the curated phrase bank.
 *
 * Reads `FRASES_GAME/curated/pending-accepted-orders.json` and applies ONLY the
 * entries a human marked `"approved": true`. Every one is re-checked against the
 * phrase's pieces before it is written — the proposal script already did that,
 * but this file is hand-edited in between.
 *
 *   node scripts/apply-accepted-orders.mjs --dry-run   # show what would change
 *   node scripts/apply-accepted-orders.mjs             # write the curated files
 *
 * Idempotent: an alternative already present is skipped. Afterwards rebuild the
 * artifact and force a reseed — the normal seed skips non-empty tables, so the
 * SQLite bank that server mode reads would keep the old answers:
 *
 *   npm run prebuild:phrase-game && FORCE_RESEED=1 npm run seed:content
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkAcceptedOrder } from "./accepted-orders-lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(__dirname, "..");
const REPO_ROOT = join(WEB_ROOT, "..");
const CURATED_DIR = join(REPO_ROOT, "FRASES_GAME", "curated");
const REVIEW = join(CURATED_DIR, "pending-accepted-orders.json");
const BANK = join(WEB_ROOT, "src", "data", "phrase-game", "phrases.json");

const dryRun = process.argv.includes("--dry-run");

/** Curated bank. */
function curatedFiles() {
  return [join(CURATED_DIR, "phrases.json")];
}

function main() {
  let review;
  try {
    review = JSON.parse(readFileSync(REVIEW, "utf8"));
  } catch {
    console.error(
      `[accepted-orders] no review file at ${REVIEW}\n` +
        "Run: node scripts/propose-accepted-orders.mjs --llm",
    );
    process.exit(1);
  }

  const approved = (review.proposals ?? []).filter((p) => p.approved === true);
  const pending = (review.proposals ?? []).length - approved.length;
  console.log(`[accepted-orders] ${approved.length} approved, ${pending} still awaiting review`);
  if (approved.length === 0) {
    console.log('[accepted-orders] nothing to apply — set "approved": true on the ones you accept.');
    return;
  }

  // The built bank is the source of truth for a phrase's pieces; the curated
  // files hold `words`, which is the same list before the build adds pinyin.
  const bank = JSON.parse(readFileSync(BANK, "utf8"));
  const piecesById = new Map(
    bank.phrases.map((p) => [p.id, { hanzi: p.hanzi, pieces: p.tokens.map((t) => t.palavra) }]),
  );

  const wanted = new Map();
  const problems = [];
  for (const entry of approved) {
    const phrase = piecesById.get(entry.id);
    if (!phrase) {
      problems.push(`${entry.id}: not in the built bank — rebuild first`);
      continue;
    }
    const existing = wanted.get(entry.id) ?? [];
    const verdict = checkAcceptedOrder(entry.alternative, { ...phrase, existing });
    if (!verdict.ok) {
      problems.push(`${entry.id}: "${entry.alternative}" — ${verdict.reason}`);
      continue;
    }
    wanted.set(entry.id, [...existing, entry.alternative]);
  }

  if (problems.length > 0) {
    console.error(`[accepted-orders] ${problems.length} approved entries are invalid:`);
    for (const p of problems) console.error(`   ${p}`);
    console.error("[accepted-orders] nothing written; fix the review file and re-run.");
    process.exit(1);
  }

  let touchedFiles = 0;
  let added = 0;
  const unplaced = new Set(wanted.keys());

  for (const file of curatedFiles()) {
    const data = JSON.parse(readFileSync(file, "utf8"));
    let changed = false;
    for (const phrase of data.phrases ?? []) {
      const alternatives = wanted.get(phrase.id);
      if (!alternatives) continue;
      unplaced.delete(phrase.id);
      const current = Array.isArray(phrase.respostasAceitas) ? phrase.respostasAceitas : [];
      const merged = [...current];
      for (const alternative of alternatives) {
        if (!merged.includes(alternative)) {
          merged.push(alternative);
          added += 1;
          changed = true;
          console.log(`   ${phrase.id}  +${alternative}`);
        }
      }
      if (merged.length > 0) phrase.respostasAceitas = merged;
    }
    if (changed) {
      touchedFiles += 1;
      if (!dryRun) writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    }
  }

  for (const id of unplaced) console.error(`[accepted-orders] ${id}: not found in any curated file`);

  console.log(
    `\n[accepted-orders] ${added} alternative(s) across ${touchedFiles} file(s)` +
      (dryRun ? " — DRY RUN, nothing written" : " written"),
  );
  if (!dryRun && added > 0) {
    // seed-content-db.mjs skips tables that already have rows, so a plain
    // reseed would leave the DB (which server mode reads) on the old bank.
    console.log(
      "[accepted-orders] next:\n" +
        "   npm run prebuild:phrase-game\n" +
        "   FORCE_RESEED=1 npm run seed:content     # the plain seed skips non-empty tables",
    );
  }
}

main();
