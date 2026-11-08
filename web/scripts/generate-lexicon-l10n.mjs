#!/usr/bin/env node
/**
 * One-shot builder: appMobile/ios/lexico.json → data/app-library/lexicon-l10n.json
 * Uses MyMemory for EN↔ES and PT↔EN/ES with on-disk cache (respect rate limits).
 */
import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = resolve(__dirname, "..");
const LEXICO_PATH = resolve(WEB_ROOT, "../appMobile/ios/lexico.json");
const OUT_PATH = join(WEB_ROOT, "data", "app-library", "lexicon-l10n.json");
const CACHE_PATH = join(WEB_ROOT, "scripts", ".cache", "lexicon-l10n-mt.json");

const CATEGORIES = {
  basics: {
    en: "Basics: numbers and questions",
    es: "Básicos: números y preguntas",
  },
  people: {
    en: "People, family and pronouns",
    es: "Personas, familia y pronombres",
  },
  places_world: {
    en: "Places, countries and movement",
    es: "Lugares, países y movimiento",
  },
  food: {
    en: "Food, kitchen and drinks",
    es: "Comida, cocina y bebidas",
  },
  descriptions: {
    en: "Colors and qualities",
    es: "Colores y cualidades",
  },
  verbs: {
    en: "Verbs, likes and preferences",
    es: "Verbos, gustos y preferencias",
  },
  grammar_bits: {
    en: "Particles and essential review",
    es: "Partículas y repaso esencial",
  },
  weather: {
    en: "Time, weather and calendar",
    es: "Tiempo, clima y calendario",
  },
  health: {
    en: "Health and body",
    es: "Salud y cuerpo",
  },
  study: {
    en: "Study and school",
    es: "Estudio y escuela",
  },
};

/** Hand-tuned EN/ES when pack `translation` is Portuguese (short learner glosses). */
const PT_GLOSS = {
  "1-幺": {
    en: "one (phone, codes, digit sequences)",
    es: "uno (teléfono, códigos, secuencias de dígitos)",
  },
  "2-毛": { en: "tenth of a yuan", es: "décima de yuan" },
  "2-钱": { en: "money", es: "dinero" },
  "2-岁": { en: "years of age", es: "años de edad" },
  "6-红色": { en: "red", es: "rojo" },
  "8-几号": { en: "which day (of the month)", es: "qué día (del mes)" },
  "23-少许": { en: "a little bit", es: "un poquito" },
  "23-难吃": { en: "tastes bad", es: "mal sabor" },
  "ctx-aulas_semana2-烦恼": { en: "worry; annoyed", es: "preocupación; molestia" },
  "ctx-aulas_semana2-心里": { en: "in one's heart; inwardly", es: "por dentro; en el corazón" },
  "ctx-aulas_semana2-信心": { en: "confidence", es: "confianza" },
  "ctx-china_cozinha_2026-08-26-案板": {
    en: "cutting board; prep counter",
    es: "tabla de cortar; encimera de preparación",
  },
  "ctx-china_cozinha_2026-08-26-红辣椒": { en: "red chili pepper", es: "chile rojo" },
  "ctx-china_cozinha_2026-08-26-煎牛排": {
    en: "pan-fry a steak",
    es: "freír un bistec en la sartén",
  },
  "ctx-china_cozinha_2026-08-26-芥末酱": { en: "mustard sauce", es: "salsa de mostaza" },
  "ctx-china_cozinha_2026-08-26-牛油": {
    en: "beef fat (varies by region)",
    es: "grasa de res (varía según la región)",
  },
  "ctx-china_cozinha_2026-08-26-沙拉酱": { en: "salad dressing", es: "aderezo para ensalada" },
  "ctx-china_cozinha_2026-08-26-苹果": { en: "apple", es: "manzana" },
  "ctx-china_cozinha_2026-08-26-苹果汁": { en: "apple juice", es: "jugo de manzana" },
  "ctx-china_cozinha_2026-08-26-菜板": { en: "cutting board", es: "tabla de cortar" },
  "ctx-china_cozinha_2026-08-26-陈醋": { en: "aged vinegar", es: "vinagre añejo" },
  "ctx-china_cozinha_2026-08-26-厨房": { en: "kitchen (room)", es: "cocina (lugar)" },
  "ctx-china_cozinha_2026-08-26-鸡汤": { en: "chicken broth/soup", es: "caldo/sopa de pollo" },
  "ctx-china_cozinha_2026-08-26-酱油": { en: "soy sauce", es: "salsa de soja" },
  "ctx-china_cozinha_2026-08-26-烤串": { en: "grilled skewer", es: "brochetas a la parrilla" },
  "ctx-china_cozinha_2026-08-26-烤肉": { en: "grilled meat", es: "carne a la parrilla" },
  "ctx-china_cozinha_2026-08-26-辣椒油": { en: "chili oil", es: "aceite de chile" },
  "ctx-china_cozinha_2026-08-26-老抽": { en: "dark soy sauce", es: "salsa de soja oscura" },
  "ctx-china_cozinha_2026-08-26-料酒": { en: "Chinese cooking wine", es: "vino de cocina chino" },
  "ctx-china_cozinha_2026-08-26-青椒": { en: "green bell pepper", es: "pimiento verde" },
  "ctx-china_cozinha_2026-08-26-三文鱼": { en: "salmon", es: "salmón" },
  "ctx-china_cozinha_2026-08-26-勺子": { en: "spoon", es: "cuchara" },
  "ctx-china_cozinha_2026-08-26-生抽": { en: "light soy sauce", es: "salsa de soja clara" },
  "ctx-china_cozinha_2026-08-26-糖": { en: "sugar", es: "azúcar" },
  "ctx-china_cozinha_2026-08-26-玉米": { en: "corn", es: "maíz" },
};

const EN_PROPER = new Set([
  "Argentina",
  "Beijing",
  "France",
  "Japan",
  "China",
  "Chinese",
  "America",
  "USA",
  "Hong Kong",
  "Taiwan",
  "Shanghai",
  "Terracotta Warriors and Horses",
  "West Lake",
  "Bird's Nest",
  "Spring Festival",
]);

function loadCache() {
  if (!existsSync(CACHE_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CACHE_PATH, "utf8"));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  mkdirSync(dirname(CACHE_PATH), { recursive: true });
  writeFileSync(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function myMemory(text, pair) {
  const key = `${pair}\0${text}`;
  if (!text.trim()) return "";
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(pair)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(25_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.quotaFinished) throw new Error("MyMemory quota finished");
  const out = data.responseData?.translatedText ?? "";
  if (!out) throw new Error("empty translation");
  return out;
}

async function translateCached(cache, text, pair) {
  const key = `${pair}\0${text}`;
  if (cache[key]) return cache[key];
  await sleep(320);
  const translated = await myMemory(text, pair);
  cache[key] = translated;
  saveCache(cache);
  return translated;
}

async function translateParts(cache, text, pair) {
  const parts = text.split(/\s*;\s*/).filter(Boolean);
  if (parts.length <= 1) return translateCached(cache, text, pair);
  const out = [];
  for (const p of parts) {
    out.push(await translateCached(cache, p.trim(), pair));
  }
  return out.join("; ");
}

function cleanEnglish(raw) {
  let t = raw.trim();
  // Drop trailing CJK gloss noise
  t = t.replace(/[\u4e00-\u9fff\u3400-\u4dbf]+/g, "").trim();
  t = t.replace(/\s+/g, " ");
  t = t.replace(/\s*\/\s*/g, " / ");
  return t;
}

function looksPortuguese(text) {
  if (/[ãõç]/i.test(text)) return true;
  if (
    /\b(não|você|vocês|também|muito|irmão|irmã|filha|filho|mãe|pai|vermelho|dinheiro|cozinha|manhã|tarde|noite|praça|casa|olhos|caldo|molho|pimenta|carne|açúcar|maçã|vinagre|grelhar|espetinho|salmão|colher|milho|decidir|participar|trabalhar|cozinhar|lavar|assar|fritar|estação|amanhã|verão|revisão|conversação|parceiro|colega|vaso|jarro|coroa|fumaça|França|Japão)\b/i.test(
      text,
    )
  )
    return true;
  if (/\b(de|da|do|dos|das|para|por)\s+(dia|manhã|parte|quem)\b/i.test(text)) return true;
  if (/\bum\s*\(/i.test(text)) return true;
  if (/\bque\s+dia\b/i.test(text)) return true;
  if (/\banos\s+de\s+idade\b/i.test(text)) return true;
  if (/\bdécimo\s+de\s+yuan\b/i.test(text)) return true;
  if (/\bruim\s+de\s+comer\b/i.test(text)) return true;
  if (/\bum\s+pouquinho\b/i.test(text)) return true;
  if (/\bpor\s+dentro\b/i.test(text)) return true;
  if (/\bpreocupação\b/i.test(text)) return true;
  if (/\bconfiança\b/i.test(text)) return true;
  if (/\btábua\b/i.test(text)) return true;
  if (/\bgordura\s+bovina\b/i.test(text)) return true;
  if (/\bsítio\b/i.test(text)) return true;
  if (/\benvelhecido\b/i.test(text)) return true;
  if (/\bclassificador\b/i.test(text)) return true;
  if (/\bpartícula\b/i.test(text)) return true;
  if (/\bcom\s+sono\b/i.test(text)) return true;
  return false;
}

function isLikelyEnglish(text) {
  if (looksPortuguese(text)) return false;
  // Mostly ASCII / Latin learner gloss
  const letters = text.replace(/[^a-zA-Z]/g, "");
  if (letters.length < 2) return true;
  return true;
}

async function glossForEntry(cache, entry) {
  const pt = entry.translation?.trim() ?? "";
  const manual = PT_GLOSS[entry.id];
  if (manual) return { en: manual.en, es: manual.es };

  let en = cleanEnglish(pt);
  let es;

  if (looksPortuguese(pt)) {
    en = cleanEnglish(await translateParts(cache, pt, "pt|en"));
    es = await translateParts(cache, pt, "pt|es");
  } else {
    en = cleanEnglish(pt);
    if (!en) en = pt;
    es = await translateParts(cache, en, "en|es");
  }

  // Keep known proper nouns stable in Spanish when gloss is a single token
  if (EN_PROPER.has(en)) es = en;

  return { en, es };
}

async function main() {
  const lexico = JSON.parse(readFileSync(LEXICO_PATH, "utf8"));
  const cache = loadCache();
  const entries = {};
  let i = 0;
  for (const e of lexico.entries) {
    i += 1;
    if (i % 25 === 0) process.stderr.write(`… ${i}/${lexico.entries.length}\n`);
    try {
      entries[e.id] = await glossForEntry(cache, e);
    } catch (err) {
      console.error(`FAIL ${e.id}: ${err.message}`);
      const en = cleanEnglish(e.translation);
      entries[e.id] = { en, es: en };
    }
  }

  const out = {
    meta: {
      note: "Overlay for library entries/categories; translation field in pack stays as-is (often pt).",
    },
    categories: CATEGORIES,
    entries,
  };

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, `${JSON.stringify(out, null, 2)}\n`, "utf8");

  const sampleIds = lexico.entries.slice(0, 3).map((e) => e.id);
  console.log(
    JSON.stringify(
      {
        path: OUT_PATH,
        categories: Object.keys(CATEGORIES).length,
        entries: Object.keys(entries).length,
        samples: sampleIds.map((id) => {
          const src = lexico.entries.find((e) => e.id === id);
          return {
            id,
            pt: src?.translation,
            ...entries[id],
          };
        }),
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
