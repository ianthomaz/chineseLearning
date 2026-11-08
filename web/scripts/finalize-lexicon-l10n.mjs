#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const WEB_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LEXICO = resolve(WEB_ROOT, "../appMobile/ios/lexico.json");
const L10N = join(WEB_ROOT, "data", "app-library", "lexicon-l10n.json");
const CACHE = join(WEB_ROOT, "scripts", ".cache", "lexicon-l10n-mt.json");

const EN_SAME_AS_ES = new Set([
  "Argentina",
  "Bird's Nest",
  "Grape Valley",
  "Terracotta Warriors and Horses",
  "West Lake",
  "ah; oh",
  "China",
  "Portugal",
  "banana",
  "hotel",
  "bar",
  "score",
  "jiaozi, dumpling",
]);

const PT_ONLY =
  /\b(nome|pessoa|ser|eu|nós|eles|como|não|sim|ou|de|da|do|uma|minha|nossa|avó|avô|mãe|pai|filho|filha|irmão|irmã|escola|livro|porta|coisa|roupa|cadeira|estudante|hospital|computador|chá|beber|morango|laranja|melancia|banana|copo|garfo|receita|sal|óleo|forno|fogão|geladeira|micro-ondas|prato|amigo|família|tempo|clima|chuva|quente|frio|bonito|bom|amarelo|azul|gostoso|agora|hoje|ontem|amanhã|semana|mês|hora|minuto|primavera|verão|inverno|outono|quanto|quantos|pergunta|relógio|grama|litro|mililitro|quilograma|cinza|feliz|paciência|tarefa|novo|profissional|desanimado|prestativo|também|ainda|vocabulário|pequim|brasil|portugal|francês|chinês|português|este ano|ano passado|ano que vem|surfar|estudar|ir|fazer hora extra|tomar banho|tirar foto|experiência|vivência|ficar tranquilo|ponto turístico|amigo para comer junto|espátula|prato saltado|cozido|pronto|quantidade adequada|avó paterna|avô materno|avó materna|avô paterno)\b|[ãõç]/i;

function isEnglishish(text) {
  return /\b(to|the|and|or|of|with|for|sb|sth|verb|n\.|adj\.|mw|measure)\b/i.test(text);
}

function isPortugueseSource(text) {
  if (PT_ONLY.test(text)) return true;
  if (isEnglishish(text)) return false;
  return false;
}

function cleanEnglish(raw) {
  return raw
    .trim()
    .replace(/[\u4e00-\u9fff\u3400-\u4dbf]+/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function mt(cache, text, pair) {
  const key = `${pair}\0${text}`;
  if (cache[key]) return cache[key];
  await sleep(280);
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(pair)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(45_000) });
  const data = await res.json();
  const out = data.responseData?.translatedText?.trim();
  if (!out) throw new Error("empty");
  cache[key] = out;
  writeFileSync(CACHE, `${JSON.stringify(cache, null, 2)}\n`);
  return out;
}

async function translateParts(cache, text, pair) {
  const chunks = text.split(/\s*;\s*/).filter(Boolean);
  if (chunks.length <= 1) return mt(cache, text, pair);
  const out = [];
  for (const c of chunks) {
    out.push(await mt(cache, c.trim(), pair));
  }
  return out.join("; ");
}

async function buildGloss(cache, translation) {
  const src = translation.trim();
  if (isPortugueseSource(src)) {
    return {
      en: cleanEnglish(await translateParts(cache, src, "pt|en")),
      es: await translateParts(cache, src, "pt|es"),
    };
  }
  const en = cleanEnglish(src);
  let es = cache[`en|es\0${en}`];
  if (!es || es.toLowerCase() === en.toLowerCase()) {
    es = await translateParts(cache, en, "en|es");
  }
  if (EN_SAME_AS_ES.has(en)) es = en;
  return { en, es };
}

async function main() {
  const lexico = JSON.parse(readFileSync(LEXICO, "utf8"));
  const l10n = JSON.parse(readFileSync(L10N, "utf8"));
  const cache = JSON.parse(readFileSync(CACHE, "utf8"));

  let i = 0;
  for (const e of lexico.entries) {
    const cur = l10n.entries[e.id];
    const srcPt = isPortugueseSource(e.translation);
    const curPt = cur && isPortugueseSource(cur.en);
    const badEs = cur && cur.en === cur.es && !EN_SAME_AS_ES.has(cur.en);
    if (!srcPt && !curPt && !badEs) continue;
    i += 1;
    if (i % 20 === 0) process.stderr.write(`… ${i}\n`);
    l10n.entries[e.id] = await buildGloss(cache, e.translation);
  }

  writeFileSync(L10N, `${JSON.stringify(l10n, null, 2)}\n`, "utf8");
  console.log("finalized", i);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
