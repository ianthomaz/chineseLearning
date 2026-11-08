#!/usr/bin/env node
/**
 * Recompute en/es from pack `translation` with broader PT detection + cache.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const WEB_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LEXICO = resolve(WEB_ROOT, "../appMobile/ios/lexico.json");
const L10N = join(WEB_ROOT, "data", "app-library", "lexicon-l10n.json");
const CACHE = join(WEB_ROOT, "scripts", ".cache", "lexicon-l10n-mt.json");

const PROPER_EN = new Set([
  "Argentina",
  "Beijing",
  "Bird's Nest",
  "Grape Valley",
  "Terracotta Warriors and Horses",
  "West Lake",
]);

const PT_HINT =
  /[ãõç]|\b(não|você|vocês|também|muito|chá|beber|morango|laranja|melancia|banana|escola|hospital|computador|estudante|livro|roupa|cadeira|avó|avô|eles|nós|português|francês|chinês|brasil|pequim|portugal|primavera|inverno|outono|anteontem|semana|minutos|agora|frio|quente|chover|gostar|querer|procurar|perguntar|escrever|ajudar|aplaudir|conversar|cozinha|tempero|manteiga|palitos|garfo|copo|receita|sal|óleo|além disso|ainda|vocabulário|coisa|entrada|meio|ali|lá|sentar|voltar|embaixo|em cima|ter|haver|caracteres|exercício|inscrever|surfar|tênis|desconto|preocupar|desculpas|febre|férias|folga|interessar|passear|gastar|esquiar|horas extra|encontrar|casar|prova|cabelo|fotos|fila|doente|bravo|lembrar|concordar|hesitar|desporto|recrutar|basquete|chutar|futebol|misturar|saltear|aquecer|tempo|clima|depois|antes|mês|meio-dia|fim de semana|quantos|quanto|pergunta|relógio|grama|litro|mililitro|quilograma|cinza|feliz|paciência|tarefa|novo|bom|amarelo|azul|bonito|gostoso|vermelho|dinheiro|profissional|desanimado|prestativo|dez mil|oito|dois|três|quatro|cinco|seis|sete|nove|dez|cem|mil|zero|um |o que|como é|que horas|estar em|mais ou menos|péssimo|branco|brigar|representar|trabalhar|dirigir|saber|conseguir)\b/i;

function cleanEnglish(raw) {
  return raw
    .trim()
    .replace(/[\u4e00-\u9fff\u3400-\u4dbf]+/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

function looksPortuguese(text) {
  return PT_HINT.test(text);
}

function fromCache(cache, pair, text) {
  return cache[`${pair}\0${text}`];
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchMt(cache, text, pair) {
  const hit = fromCache(cache, pair, text);
  if (hit) return hit;
  await sleep(300);
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(pair)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(45_000) });
  const data = await res.json();
  const out = data.responseData?.translatedText?.trim();
  if (!out) throw new Error("empty");
  cache[`${pair}\0${text}`] = out;
  writeFileSync(CACHE, `${JSON.stringify(cache, null, 2)}\n`);
  return out;
}

async function translateParts(cache, text, pair) {
  const parts = text.split(/\s*;\s*|\s*\/\s*/).filter(Boolean);
  if (parts.length <= 1) return fetchMt(cache, text, pair);
  const out = [];
  for (const p of parts) {
    out.push(await fetchMt(cache, p.trim(), pair));
  }
  return out.join("; ");
}

async function gloss(cache, translation) {
  const src = translation.trim();
  if (looksPortuguese(src)) {
    const en = cleanEnglish(await translateParts(cache, src, "pt|en"));
    const es = await translateParts(cache, src, "pt|es");
    return { en, es };
  }
  const en = cleanEnglish(src);
  let es = fromCache(cache, "en|es", en);
  if (!es || es.toLowerCase() === en.toLowerCase()) {
    try {
      es = await translateParts(cache, en, "en|es");
    } catch {
      es = en;
    }
  }
  if (PROPER_EN.has(en)) es = en;
  return { en, es };
}

async function main() {
  const lexico = JSON.parse(readFileSync(LEXICO, "utf8"));
  const l10n = JSON.parse(readFileSync(L10N, "utf8"));
  const cache = JSON.parse(readFileSync(CACHE, "utf8"));

  let i = 0;
  for (const e of lexico.entries) {
    const cur = l10n.entries[e.id];
    const needs =
      !cur ||
      looksPortuguese(cur.en) ||
      (cur.en === cur.es && !PROPER_EN.has(cur.en) && cur.en !== "ah; oh");
    if (!needs) continue;
    i += 1;
    if (i % 15 === 0) process.stderr.write(`… ${i}\n`);
    l10n.entries[e.id] = await gloss(cache, e.translation);
  }

  writeFileSync(L10N, `${JSON.stringify(l10n, null, 2)}\n`, "utf8");
  console.log("rebuilt", i, "entries");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
