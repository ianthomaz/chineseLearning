#!/usr/bin/env node
/**
 * Generates Aula-cozinha.MD, Aula-cozinha.html, and web context deck JSON.
 * Run: node build-cozinha.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { CARDS, DECK_META, MEASURES } from "./cozinha-cards.mjs";
import { PHRASE_GAME } from "./phrase-game-phrases.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const outDeck = path.join(
  repoRoot,
  "web/src/data/context-decks",
  `${DECK_META.id}.json`,
);
const outPhraseGame = path.join(
  repoRoot,
  "FRASES_GAME/curated/expansion-08-cozinha.json",
);

function mdField(key, val) {
  if (!val) return "";
  return `- ${key}: ${val}\n`;
}

function buildMd() {
  let md = `# ${DECK_META.title}\n\n`;
  md += `Aula na China · ${DECK_META.date}\n\n`;
  md += `Frases curtas; \`sentenceMeaning\` = calque literal.\n\n---\n\n`;
  for (const c of CARDS) {
    md += `## ${c.word}\n`;
    md += mdField("pinyin", c.pinyin);
    md += mdField("section", c.section);
    md += mdField("meaning", c.meaning);
    md += mdField("sentence", c.sentence);
    md += mdField("sentencePinyin", c.sentencePinyin);
    md += mdField("sentenceMeaning", c.sentenceMeaning);
    md += mdField("related", c.related);
    md += mdField("patterns", c.patterns);
    md += mdField("notes", c.notes);
    md += "\n";
  }
  return md;
}

function escapeJs(s) {
  return JSON.stringify(s);
}

function buildHtml() {
  const cardsJson = JSON.stringify(CARDS);
  const measuresJson = JSON.stringify(MEASURES);
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>${DECK_META.title}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  html, body { height: 100%; font-family: -apple-system, "PingFang SC", "Noto Sans SC", "Microsoft YaHei", Arial, sans-serif; background: #111; color: #fff; overflow: hidden; }
  #app { height: 100dvh; display: flex; flex-direction: column; padding: calc(12px + env(safe-area-inset-top)) 12px calc(10px + env(safe-area-inset-bottom)); gap: 8px; }
  .toolbar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; flex: 0 0 auto; }
  .toolbar select, .toolbar input { background: #1c1c1c; color: #fff; border: 1px solid #333; border-radius: 8px; padding: 8px 10px; font-size: 14px; }
  .toolbar input { flex: 1 1 120px; min-width: 100px; }
  .badge { font-size: 12px; color: #888; margin-left: auto; }
  .measures { flex: 0 0 auto; background: #1a1520; border: 1px solid #4a3050; border-radius: 10px; padding: 8px 10px; font-size: 12px; line-height: 1.5; color: #d8b4fe; max-height: 22vh; overflow-y: auto; }
  .measures.hidden { display: none; }
  .measures b { color: #fff; }
  .measures-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 4px 10px; margin-top: 4px; }
  #card { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; border-top: 1px solid #333; padding-top: 8px; overflow: hidden; }
  .head { display: flex; justify-content: space-between; font-size: 13px; color: #888; margin-bottom: 4px; }
  .main { flex: 0 0 auto; text-align: center; padding: 6px 0; }
  .word { font-size: 16vw; font-weight: 700; line-height: 1; letter-spacing: 2px; }
  .pinyin { color: #4db8ff; font-size: 4.5vw; margin-top: 4px; }
  .gloss { color: #bbb; font-size: 15px; margin-top: 2px; }
  .sentence-box { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; border-top: 1px solid #333; margin-top: 6px; padding-top: 8px; overflow: hidden; }
  .pattern { align-self: center; font-size: 12px; color: #ffb74d; background: #2a2115; border: 1px solid #5a4726; border-radius: 999px; padding: 3px 12px; margin-bottom: 6px; }
  .sentence-wrap { flex: 1 1 auto; min-height: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .sentence { text-align: center; font-weight: 700; line-height: 1.35; word-break: break-word; user-select: text; }
  .hl { color: #ff5252; }
  .meta { flex: 0 0 auto; margin-top: 6px; }
  .s-pinyin { color: #4db8ff; font-size: 4vw; text-align: center; }
  .s-meaning { color: #bbb; font-size: 3.6vw; text-align: center; margin-top: 2px; }
  .notes-box { flex: 0 0 auto; margin-top: 8px; }
  .notes-box label { display: block; font-size: 12px; color: #666; margin-bottom: 4px; }
  .notes-box textarea { width: 100%; min-height: 56px; max-height: 18vh; resize: vertical; background: #1a1a1a; color: #eee; border: 1px solid #333; border-radius: 8px; padding: 8px; font-size: 14px; font-family: inherit; }
  .nav { display: flex; gap: 8px; flex: 0 0 auto; margin-top: 8px; }
  .nav button { flex: 1; padding: 12px 0; font-size: 16px; font-weight: 600; border: none; border-radius: 10px; background: #2a2a2a; color: #fff; }
  .nav button:active { background: #4db8ff; color: #111; }
  .nav button:disabled { opacity: .35; }
  .tap { position: fixed; top: 80px; bottom: 120px; width: 20%; z-index: 5; }
  .tap.left { left: 0; } .tap.right { right: 0; }
</style>
</head>
<body>
<div class="tap left" id="tapL"></div>
<div class="tap right" id="tapR"></div>
<div id="app">
  <div class="toolbar">
    <select id="sectionFilter"><option value="">Todas as secções</option></select>
    <input id="search" type="search" placeholder="Buscar hanzi / pinyin…" />
    <span class="badge" id="count"></span>
  </div>
  <div class="measures" id="measures"></div>
  <section id="card"></section>
  <div class="nav">
    <button type="button" id="prev">← Anterior</button>
    <button type="button" id="next">Próximo →</button>
  </div>
</div>
<script>
const ALL_CARDS = ${cardsJson};
const MEASURES = ${measuresJson};
const STORAGE = "china-cozinha-notes-v1";
let filtered = [...ALL_CARDS];
let i = 0;

function escapeHtml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function highlight(sentence, word) {
  let out = "";
  const chars = [...word].filter(ch => ch.trim());
  for (const ch of sentence) out += chars.includes(ch) ? \`<span class="hl">\${ch}</span>\` : escapeHtml(ch);
  return out;
}
function loadNotes() {
  try { return JSON.parse(localStorage.getItem(STORAGE) || "{}"); } catch { return {}; }
}
function saveNote(word, text) {
  const n = loadNotes(); n[word] = text;
  localStorage.setItem(STORAGE, JSON.stringify(n));
}
function buildMeasures() {
  const el = document.getElementById("measures");
  el.innerHTML = "<b>Medidas</b><div class=\\"measures-grid\\">" +
    MEASURES.map(m => \`<span><b>\${escapeHtml(m.hanzi)}</b> \${escapeHtml(m.pinyin)} · \${escapeHtml(m.pt)}</span>\`).join("") +
    "</div>";
}
function buildFilter() {
  const sel = document.getElementById("sectionFilter");
  const sections = [...new Set(ALL_CARDS.map(c => c.section))];
  sections.forEach(s => {
    const o = document.createElement("option");
    o.value = s; o.textContent = s; sel.appendChild(o);
  });
  sel.onchange = applyFilter;
  document.getElementById("search").oninput = applyFilter;
}
function applyFilter() {
  const sec = document.getElementById("sectionFilter").value;
  const q = document.getElementById("search").value.trim().toLowerCase();
  filtered = ALL_CARDS.filter(c => {
    if (sec && c.section !== sec) return false;
    if (!q) return true;
    const hay = (c.word + c.pinyin + c.meaning + c.sentence).toLowerCase();
    return hay.includes(q);
  });
  i = 0;
  render();
}
function render() {
  document.getElementById("count").textContent = filtered.length ? (i+1) + " / " + filtered.length : "0";
  const card = document.getElementById("card");
  if (!filtered.length) { card.innerHTML = "<p style=\\"text-align:center;color:#666;padding:24px\\">Nada encontrado</p>"; return; }
  const it = filtered[i];
  const notes = loadNotes()[it.word] || "";
  const showMeasures = it.section === "Medidas" || document.getElementById("sectionFilter").value === "Medidas";
  document.getElementById("measures").classList.toggle("hidden", !showMeasures && !document.getElementById("sectionFilter").value);
  card.innerHTML = \`
    <div class="head"><span>\${i+1} / \${filtered.length}</span><span>\${escapeHtml(it.section)}</span></div>
    <div class="main">
      <div class="word">\${escapeHtml(it.word)}</div>
      <div class="pinyin">\${escapeHtml(it.pinyin)}</div>
      <div class="gloss">\${escapeHtml(it.meaning)}</div>
    </div>
    <div class="sentence-box">
      \${it.patterns ? \`<div class="pattern">\${escapeHtml(it.patterns)}</div>\` : ""}
      <div class="sentence-wrap"><div class="sentence" id="sentence">\${highlight(it.sentence, it.word)}</div></div>
      <div class="meta">
        <div class="s-pinyin">\${escapeHtml(it.sentencePinyin)}</div>
        <div class="s-meaning">\${escapeHtml(it.sentenceMeaning)}</div>
      </div>
      <div class="notes-box">
        <label>Minhas notas (salva no browser)</label>
        <textarea id="note" placeholder="Anotações da aula…">\${escapeHtml(notes)}</textarea>
      </div>
    </div>\`;
  document.getElementById("prev").disabled = i === 0;
  document.getElementById("next").disabled = i >= filtered.length - 1;
  document.getElementById("note").oninput = e => saveNote(it.word, e.target.value);
  requestAnimationFrame(fitText);
}
function fitText() {
  const el = document.getElementById("sentence");
  const wrap = el?.parentElement;
  if (!el || !wrap) return;
  let size = Math.round(document.documentElement.clientWidth * 0.38);
  el.style.fontSize = size + "px";
  while (size > 24 && (el.scrollWidth > wrap.clientWidth + 1 || el.scrollHeight > wrap.clientHeight + 1)) {
    size -= 1; el.style.fontSize = size + "px";
  }
}
function next() { if (i < filtered.length - 1) { i++; render(); } }
function prev() { if (i > 0) { i--; render(); } }
document.getElementById("prev").onclick = prev;
document.getElementById("next").onclick = next;
document.getElementById("tapL").onclick = prev;
document.getElementById("tapR").onclick = next;
document.body.addEventListener("keydown", e => {
  if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
  if (e.key === "ArrowLeft") prev();
});
window.addEventListener("resize", fitText);
buildMeasures();
buildFilter();
render();
</script>
</body>
</html>`;
}

function buildDeckJson() {
  return JSON.stringify({ id: DECK_META.id, title: DECK_META.title, cards: CARDS }, null, 2) + "\n";
}

fs.writeFileSync(path.join(__dirname, "Aula-cozinha.MD"), buildMd());
fs.writeFileSync(path.join(__dirname, "Aula-cozinha.html"), buildHtml());
fs.mkdirSync(path.dirname(outDeck), { recursive: true });
fs.writeFileSync(outDeck, buildDeckJson());
fs.writeFileSync(outPhraseGame, JSON.stringify(PHRASE_GAME, null, 2) + "\n");
console.log("[build-cozinha] OK", {
  cards: CARDS.length,
  phraseGame: PHRASE_GAME.phrases.length,
  md: "Aula-cozinha.MD",
  html: "Aula-cozinha.html",
  deck: outDeck,
  expansion: outPhraseGame,
});
