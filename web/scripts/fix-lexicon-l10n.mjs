#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const WEB_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LEXICO_PATH = resolve(WEB_ROOT, "../appMobile/ios/lexico.json");
const L10N_PATH = join(WEB_ROOT, "data", "app-library", "lexicon-l10n.json");
const CACHE_PATH = join(WEB_ROOT, "scripts", ".cache", "lexicon-l10n-mt.json");

const MANUAL = {
  "1-一": { en: "one (counting, quantity, usual order)", es: "uno (conteo, cantidad, orden habitual)" },
  "1-八": { en: "eight", es: "ocho" },
  "1-百": { en: "hundred", es: "cien" },
  "1-二": { en: "two", es: "dos" },
  "1-九": { en: "nine", es: "nueve" },
  "1-两": { en: "two (before measure words)", es: "dos (antes de clasificadores)" },
  "1-零": { en: "zero", es: "cero" },
  "1-六": { en: "six", es: "seis" },
  "1-七": { en: "seven", es: "siete" },
  "1-千": { en: "thousand", es: "mil" },
  "1-三": { en: "three", es: "tres" },
  "1-十": { en: "ten", es: "diez" },
  "1-四": { en: "four", es: "cuatro" },
  "1-万": { en: "ten thousand", es: "diez mil" },
  "1-五": { en: "five", es: "cinco" },
  "7-我家": { en: "my home / my family", es: "mi casa / mi familia" },
  "7-我们家": { en: "our home / our family", es: "nuestra casa / nuestra familia" },
  "9-你": { en: "you", es: "tú; usted" },
  "9-您": { en: "you (formal)", es: "usted (formal)" },
  "11-一下": { en: "a moment; briefly", es: "un momento; un poco" },
  "12-要不要": { en: "want it or not?", es: "¿lo quieres o no?" },
  "13-会": { en: "can; know how to", es: "saber; poder" },
  "13-开车": { en: "to drive", es: "conducir" },
  "ntcsl-l2-打电话": { en: "to call (someone)", es: "llamar (a alguien)" },
  "ntcsl-l2-准备": { en: "to prepare", es: "preparar" },
  "ntcsl-l2-暖和": { en: "warm", es: "cálido" },
  "ctx-tempo_relativo-后年": { en: "the year after next", es: "pasado mañana (año)" },
  "ctx-tempo_relativo-前年": { en: "the year before last", es: "anteanoche (año)" },
  "ctx-tempo_relativo-一会儿": { en: "a little while", es: "un ratito" },
  "ntcsl-l2-哎呀": { en: "ah; oh", es: "ah; oh" },
};

const PROPER_ES_SAME = new Set([
  "Argentina",
  "Beijing",
  "Bird's Nest",
  "Grape Valley",
  "Terracotta Warriors and Horses",
  "West Lake",
]);

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateEnEs(cache, text) {
  const key = `en|es\0${text}`;
  if (cache[key]) return cache[key];
  await sleep(350);
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en%7Ces`;
  const res = await fetch(url, { signal: AbortSignal.timeout(45_000) });
  const data = await res.json();
  const out = data.responseData?.translatedText?.trim();
  if (!out || out.toLowerCase() === text.toLowerCase()) throw new Error("unchanged");
  cache[key] = out;
  return out;
}

async function translateParts(cache, en) {
  const parts = en.split(/\s*;\s*/).filter(Boolean);
  if (parts.length <= 1) return translateEnEs(cache, en);
  const out = [];
  for (const p of parts) {
    out.push(await translateEnEs(cache, p.trim()));
  }
  return out.join("; ");
}

function shouldRetranslateEs(en, es) {
  if (en === es && !PROPER_ES_SAME.has(en) && !PROPER_ES_SAME.has(en.split(";")[0]?.trim())) {
    return true;
  }
  if (/^[a-z].*[ãõç]|\\b(não|você|minha|quer ou)\\b/i.test(en)) return true;
  return false;
}

async function main() {
  const lexico = loadJson(LEXICO_PATH);
  const l10n = loadJson(L10N_PATH);
  const cache = exists(CACHE_PATH) ? loadJson(CACHE_PATH) : {};

  for (const [id, fix] of Object.entries(MANUAL)) {
    if (l10n.entries[id]) Object.assign(l10n.entries[id], fix);
  }

  let n = 0;
  for (const e of lexico.entries) {
    const g = l10n.entries[e.id];
    if (!g) continue;
    if (MANUAL[e.id]) continue;
    if (!shouldRetranslateEs(g.en, g.es)) continue;
    n += 1;
    if (n % 20 === 0) process.stderr.write(`fix … ${n}\n`);
    try {
      g.es = await translateParts(cache, g.en);
    } catch (err) {
      process.stderr.write(`skip ${e.id}: ${err.message}\n`);
    }
  }

  writeFileSync(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`);
  writeFileSync(L10N_PATH, `${JSON.stringify(l10n, null, 2)}\n`, "utf8");
  console.log("patched manual", Object.keys(MANUAL).length, "retranslated attempts", n);
}

function exists(p) {
  try {
    readFileSync(p);
    return true;
  } catch {
    return false;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
