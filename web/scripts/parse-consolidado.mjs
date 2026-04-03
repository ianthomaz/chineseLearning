/**
 * Reads Content/consolidado_final.md and writes src/data/consolidado.json
 * Merges Content/review_extras.md (optional): glosses per structure line, standalone phrase lists (blocks without structures), mini-dialogues.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pinyin as toPinyin } from "pinyin-pro";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const mdPath = path.join(root, "Content", "consolidado_final.md");
const extrasPath = path.join(root, "Content", "review_extras.md");
const outPath = path.join(__dirname, "..", "src", "data", "consolidado.json");

/** @typedef {{ speaker: string; hanzi: string; pinyin: string; translation: string }} DialogueTurn */

function parseTable(lines) {
  const rows = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t.startsWith("|")) continue;
    const cells = t
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);
    if (cells.length < 3) continue;
    if (/^hanzi$/i.test(cells[0]) && /^pinyin$/i.test(cells[1])) continue;
    if (/^[-:]+$/.test(cells[0])) continue;
    let translation = cells[2];
    if (cells.length >= 4 && String(cells[3]).trim()) {
      translation = `${translation} — ${cells[3].trim()}`;
    }
    rows.push({
      hanzi: cells[0],
      pinyin: cells[1],
      translation,
    });
  }
  return rows;
}

/** Tables with Hanzi + Pinyin columns (course vocab); not verb-summary or classifier tables. */
function linesHaveVocabStyleTable(lines) {
  for (const line of lines) {
    const t = line.trim();
    if (!t.startsWith("|")) continue;
    if (/^\|\s*[-:|]+\s*\|/.test(t)) continue;
    const lower = t.toLowerCase();
    return lower.includes("hanzi") && lower.includes("pinyin");
  }
  return false;
}

function parseListLines(lines) {
  const items = [];
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("- ")) items.push(t.slice(2).trim());
    else if (/^\d+\.\s/.test(t)) items.push(t.replace(/^\d+\.\s*/, "").trim());
  }
  return items;
}

/** @param {string} pt @param {string} en @param {string} es */
function locLine(pt, en, es) {
  return {
    pt: pt ?? "",
    en: en ?? "",
    es: es ?? "",
  };
}

/**
 * @param {string[]} lines
 * @returns {Array<Array<{ speaker: string; hanzi: string; pinyin: string; translation: { pt: string; en: string; es: string } }>>}
 */
function parseConversationList(lines) {
  /** @type {DialogueTurn[][]} */
  const conversations = [];
  /** @type {DialogueTurn[] | null} */
  let current = null;

  function flush() {
    if (current && current.length) conversations.push(current);
    current = null;
  }

  for (const line of lines) {
    if (/^\*\*(Conversa|Diálogo)\s+\d+\*\*\s*$/i.test(line.trim())) {
      flush();
      current = [];
      continue;
    }
    const bullet = line.match(/^-\s+(.+)$/);
    if (bullet) {
      if (!current) current = [];
      const parts = bullet[1].split("|").map((s) => s.trim());
      if (parts.length >= 6) {
        current.push({
          speaker: parts[0],
          hanzi: parts[1],
          pinyin: parts[2],
          translation: locLine(parts[3], parts[4], parts[5]),
        });
      } else if (parts.length >= 4) {
        const pt = parts[3];
        current.push({
          speaker: parts[0],
          hanzi: parts[1],
          pinyin: parts[2],
          translation: locLine(pt, pt, pt),
        });
      }
    }
  }
  flush();
  return conversations;
}

/**
 * @param {string} headingLower
 * @returns {"pt" | "en" | "es" | null}
 */
function glossLocaleFromHeading(headingLower) {
  if (!headingLower.includes("frase") && !headingLower.includes("phrase")) return null;
  if (
    headingLower.includes("(en)") ||
    headingLower.includes("english") ||
    headingLower.includes("inglês") ||
    headingLower.includes("ingles")
  )
    return "en";
  if (
    headingLower.includes("(es)") ||
    headingLower.includes("español") ||
    headingLower.includes("espanhol") ||
    headingLower.includes("espanol")
  )
    return "es";
  if (
    headingLower.includes("tradução") ||
    headingLower.includes("traducao") ||
    headingLower.includes("português") ||
    headingLower.includes("portugues") ||
    headingLower.includes("(pt)")
  )
    return "pt";
  if (headingLower.includes("translation") && !headingLower.includes("phrase")) return null;
  if (headingLower.includes("phrase") && headingLower.includes("translation")) return "en";
  return "pt";
}

/**
 * @param {string} body
 * @returns {{ structureGlosses: { pt: string[]; en: string[]; es: string[] }; reviewMiniDialogues: DialogueTurn[][] }}
 */
function parseExtrasBody(body) {
  /** @type {{ pt: string[]; en: string[]; es: string[] }} */
  const structureGlosses = { pt: [], en: [], es: [] };
  let reviewMiniDialogues = [];
  const chunks = body.split(/\n(?=### )/).map((s) => s.trim()).filter(Boolean);
  for (const chunk of chunks) {
    const lines = chunk.split("\n");
    const headingRaw = lines[0].replace(/^###\s*/, "").trim();
    const heading = headingRaw.toLowerCase();
    const content = lines.slice(1);
    const glossLoc = glossLocaleFromHeading(heading);
    if (glossLoc) {
      structureGlosses[glossLoc] = parseListLines(content);
    } else if (heading.includes("mini-diálogo") || heading.includes("mini dialogo")) {
      reviewMiniDialogues = parseConversationList(content);
    }
  }
  return { structureGlosses, reviewMiniDialogues };
}

/**
 * @param {string} raw
 * @returns {Map<number, { structureGlosses: { pt: string[]; en: string[]; es: string[] }; reviewMiniDialogues: DialogueTurn[][] }>}
 */
function parseReviewExtrasFile(raw) {
  const map = new Map();
  const re = /^## (\d+)\s*$/gm;
  const hits = [];
  let m;
  while ((m = re.exec(raw)) !== null) {
    hits.push({ id: parseInt(m[1], 10), index: m.index, len: m[0].length });
  }
  for (let i = 0; i < hits.length; i++) {
    const { id, index, len } = hits[i];
    const start = index + len;
    const end = i + 1 < hits.length ? hits[i + 1].index : raw.length;
    const body = raw.slice(start, end).trim();
    map.set(id, parseExtrasBody(body));
  }
  return map;
}

function structureLineWithPinyin(hanziRaw) {
  const hanzi = hanziRaw.trim();
  if (!hanzi) return { hanzi, pinyin: "" };
  let pinyinStr = toPinyin(hanzi, {
    toneType: "symbol",
    type: "string",
    separator: " ",
  }).trim();
  pinyinStr = pinyinStr.replace(/\s+([，。！？、；：])/g, "$1");
  return { hanzi, pinyin: pinyinStr };
}

function splitSections(sectionBody) {
  const s = sectionBody.trim();
  if (!s) return [];
  const parts = s.split(/\n### /);
  return parts.map((raw) => {
    const lines = raw.split("\n");
    const heading = lines[0].replace(/^###\s*/, "").trim();
    return { heading, lines: lines.slice(1) };
  });
}

function parseBlock(headerLine, body) {
  const hm = headerLine.match(/^(\d+)\.\s*(.+)$/);
  if (!hm) return null;
  const id = parseInt(hm[1], 10);
  const title = hm[2].trim();

  const firstSection = body.indexOf("\n### ");
  const narrativeRaw =
    firstSection === -1 ? body : body.slice(0, firstSection);
  const narrative = narrativeRaw.trim();
  const rest =
    firstSection === -1 ? "" : body.slice(firstSection + 1).trimStart();

  const sections = splitSections(rest);

  const block = {
    id,
    title,
    narrative,
    structures: [],
    notes: [],
    differences: [],
    priorities: [],
    vocabulary: [],
    structureGlosses: { pt: [], en: [], es: [] },
    /** When there are no structure lines, phrase translations from review_extras go here */
    reviewStandalonePhrases: { pt: [], en: [], es: [] },
    reviewMiniDialogues: [],
  };

  for (const { heading, lines } of sections) {
    const h = heading.toLowerCase();
    if (h.includes("estruturas centrais")) {
      block.structures = parseListLines(lines).map(structureLineWithPinyin);
    } else if (h.includes("observa")) {
      block.notes = parseListLines(lines);
    } else if (h.includes("diferen")) {
      block.differences = parseListLines(lines);
    } else if (h.includes("prioridades")) {
      block.priorities = parseListLines(lines);
    } else if (h.includes("vocabul")) {
      block.vocabulary = parseTable(lines);
    } else if (linesHaveVocabStyleTable(lines)) {
      const rows = parseTable(lines);
      if (rows.length) block.vocabulary.push(...rows);
    }
  }

  return { block };
}

function padGlossArray(arr, n) {
  let a = [...(arr ?? [])];
  while (a.length < n) a.push("");
  if (a.length > n) a = a.slice(0, n);
  return a;
}

function mergeReviewExtras(blocks, extrasMap) {
  for (const block of blocks) {
    const ex = extrasMap.get(block.id);
    const n = block.structures.length;
    const src = ex?.structureGlosses ?? { pt: [], en: [], es: [] };

    if (n === 0) {
      let pt = [...(src.pt ?? [])];
      let en = [...(src.en ?? [])];
      let es = [...(src.es ?? [])];
      const m = Math.max(pt.length, en.length, es.length);
      pt = padGlossArray(pt, m);
      en = padGlossArray(en, m);
      es = padGlossArray(es, m);
      for (let i = 0; i < m; i++) {
        if (!String(en[i] ?? "").trim()) en[i] = pt[i] ?? "";
        if (!String(es[i] ?? "").trim()) es[i] = pt[i] ?? "";
      }
      block.structureGlosses = { pt: [], en: [], es: [] };
      block.reviewStandalonePhrases = { pt, en, es };
    } else {
      const pt = padGlossArray(src.pt, n);
      const en = padGlossArray(src.en, n);
      const es = padGlossArray(src.es, n);
      for (let i = 0; i < n; i++) {
        if (!String(en[i] ?? "").trim()) en[i] = pt[i] ?? "";
        if (!String(es[i] ?? "").trim()) es[i] = pt[i] ?? "";
      }
      block.structureGlosses = { pt, en, es };
      block.reviewStandalonePhrases = { pt: [], en: [], es: [] };
    }

    block.reviewMiniDialogues = ex?.reviewMiniDialogues?.length
      ? ex.reviewMiniDialogues
      : [];
  }
}

function main() {
  const raw = fs.readFileSync(mdPath, "utf8");
  const withoutH1 = raw.replace(/^#[^\n]*\n+/, "").replace(/^## /, "");
  /** Only top-level numbered sections (## 1. … ## 22.); inner ## (e.g. dialogue titles) stay inside the chunk. */
  const chunks = withoutH1.split(/\n(?=## \d+\.\s)/).filter(Boolean);

  const blocks = [];
  for (const chunk of chunks) {
    const lines = chunk.split("\n");
    const headerLine = lines[0].replace(/^##\s+/, "").trim();
    const body = lines.slice(1).join("\n");
    const parsed = parseBlock(headerLine, body);
    if (!parsed) continue;
    /** Duplicate of review_extras.md already merged into blocks 1–15. */
    if (parsed.block.id === 21) continue;
    blocks.push(parsed.block);
  }

  blocks.sort((a, b) => a.id - b.id);

  let extrasMap = new Map();
  if (fs.existsSync(extrasPath)) {
    const extrasRaw = fs.readFileSync(extrasPath, "utf8");
    extrasMap = parseReviewExtrasFile(extrasRaw);
  }
  mergeReviewExtras(blocks, extrasMap);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({ blocks }, null, 2), "utf8");
  console.log(`Wrote ${blocks.length} blocks to ${outPath}`);
}

main();
