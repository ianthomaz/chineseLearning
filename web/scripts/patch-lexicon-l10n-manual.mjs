#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const L10N = join(resolve(dirname(fileURLToPath(import.meta.url)), ".."), "data", "app-library", "lexicon-l10n.json");

const PATCH = {
  "3-茶": { en: "tea", es: "té" },
  "7-名字": { en: "name", es: "nombre" },
  "8-什么": { en: "what", es: "qué" },
  "8-怎么": { en: "how", es: "cómo" },
  "14-去": { en: "to go", es: "ir" },
  "10-不": { en: "not; no", es: "no" },
  "ntcsl-l2-被子": { en: "quilt", es: "edredón" },
  "ntcsl-l2-机会": { en: "chance; opportunity", es: "oportunidad; posibilidad" },
  "ntcsl-l2-帽子": { en: "hat", es: "sombrero" },
  "ntcsl-l2-手续": { en: "procedure", es: "trámite; procedimiento" },
  "ntcsl-l2-线": { en: "line", es: "línea" },
  "ntcsl-l2-玉": { en: "jade", es: "jade" },
  "ntcsl-l2-兵马俑": {
    en: "Terracotta Warriors and Horses",
    es: "Guerreros y caballos de terracota",
  },
  "ctx-hsk2_hsk3_contexts-身体": { en: "body", es: "cuerpo" },
  "2-块": { en: "yuan (informal)", es: "yuan (informal)" },
  "23-斤": { en: "jin (~500 g)", es: "jin (~500 g)" },
  "23-煎饺": { en: "pan-fried jiaozi", es: "jiaozi frito en sartén" },
  "23-饺子": { en: "jiaozi; dumpling", es: "jiaozi; dumpling" },
  "23-油": { en: "oil", es: "aceite" },
  "23-青椒": { en: "green bell pepper", es: "pimiento verde" },
  "ctx-aulas_semana2-冲浪": { en: "to surf", es: "hacer surf" },
  "ctx-aulas_semana2-饭友": { en: "meal buddy", es: "amigo para comer" },
  "23-适量": { en: "appropriate amount", es: "cantidad adecuada" },
  "23-炒菜": { en: "stir-fried dish", es: "plato salteado en wok" },
  "23-铲子": { en: "spatula", es: "espátula" },
  "23-烤箱": { en: "oven", es: "horno" },
  "23-熟": { en: "cooked; done", es: "cocido; listo" },
  "23-微波炉": { en: "microwave", es: "microondas" },
  "12-还是": { en: "or (still / instead)", es: "o; en cambio" },
};

const l10n = JSON.parse(readFileSync(L10N, "utf8"));
for (const [id, gloss] of Object.entries(PATCH)) {
  l10n.entries[id] = gloss;
}
writeFileSync(L10N, `${JSON.stringify(l10n, null, 2)}\n`, "utf8");
console.log("patched", Object.keys(PATCH).length);
