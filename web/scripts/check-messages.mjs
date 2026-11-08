#!/usr/bin/env node
/**
 * Guards for web/src/messages/{en,pt,es}.json (see CLAUDE.md § Língua):
 *   - every key exists in the three languages (a missing key renders its path);
 *   - no empty values;
 *   - the same {placeholders} in every language;
 *   - pt is Brazilian: no pt-PT words or «» quotes.
 * Runs as part of `npm run lint`. Exit 1 on any problem.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "messages");
const LOCALES = ["en", "pt", "es"];
const BASE = "en";

// Words that mark pt-PT. Whole words, case-insensitive.
const PT_PT = [
  "ecrã", "ecrãs", "telemóvel", "telemóveis", "podes", "guardar", "guardado", "guardados", "guardada", "guardadas",
  "utilizador", "utilizadores", "ficheiro", "ficheiros", "carregue", "autocarro", "pequeno-almoço", "fixe", "miúdo",
];
const PT_PT_PHRASES = ["a carregar", "clica em", "faz login"];

function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

const messages = Object.fromEntries(
  LOCALES.map((l) => [l, flatten(JSON.parse(readFileSync(join(dir, `${l}.json`), "utf8")))]),
);
const problems = [];
const placeholders = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

for (const locale of LOCALES) {
  if (locale === BASE) continue;
  for (const key of Object.keys(messages[BASE])) {
    if (!(key in messages[locale])) problems.push(`${locale}: missing key ${key}`);
  }
  for (const key of Object.keys(messages[locale])) {
    if (!(key in messages[BASE])) problems.push(`${locale}: key not in ${BASE}: ${key}`);
  }
}
for (const locale of LOCALES) {
  for (const [key, value] of Object.entries(messages[locale])) {
    if (typeof value === "string" && value.trim() === "") problems.push(`${locale}: empty value at ${key}`);
    if (locale !== BASE && key in messages[BASE] && placeholders(value) !== placeholders(messages[BASE][key])) {
      problems.push(`${locale}: placeholders differ from ${BASE} at ${key}`);
    }
  }
}
const ptWord = new RegExp(`(^|[^\\p{L}])(${PT_PT.join("|")})(?![\\p{L}])`, "iu");
const ptPhrase = new RegExp(`(^|[^\\p{L}])(${PT_PT_PHRASES.join("|")})(?![\\p{L}])`, "iu");
for (const [key, value] of Object.entries(messages.pt)) {
  if (typeof value !== "string") continue;
  const hit = value.match(ptWord) ?? value.match(ptPhrase);
  if (hit) problems.push(`pt: pt-PT wording "${hit[2]}" at ${key}`);
  if (/[«»]/.test(value)) problems.push(`pt: «» quotes at ${key}`);
}

if (problems.length) {
  for (const p of problems) console.error(`[messages] ${p}`);
  console.error(`[messages] ${problems.length} problem(s)`);
  process.exit(1);
}
console.log(`[messages] ok — ${Object.keys(messages[BASE]).length} keys × ${LOCALES.length} languages`);
