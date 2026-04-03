/**
 * Merges Content/review_extras.md (PT glosses + 4-col dialogues) with
 * review-extras-locale-data.mjs (EN/ES) and overwrites review_extras.md
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { blocks as localeBlocks } from "./review-extras-locale-data.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const mdPath = path.join(root, "Content", "review_extras.md");

function parseListLines(text) {
  const items = [];
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (t.startsWith("- ")) items.push(t.slice(2).trim());
    else if (/^\d+\.\s/.test(t)) items.push(t.replace(/^\d+\.\s*/, "").trim());
  }
  return items;
}

function parseDialogueTurns(sectionText) {
  const turns = [];
  for (const line of sectionText.split("\n")) {
    const t = line.trim();
    const bullet = t.match(/^-\s+(.+)$/);
    if (!bullet) continue;
    const parts = bullet[1].split("|").map((s) => s.trim());
    if (parts.length >= 4) {
      turns.push({
        speaker: parts[0],
        hanzi: parts[1],
        pinyin: parts[2],
        pt: parts[3],
      });
    }
  }
  return turns;
}

function splitBlockBody(body) {
  const miniIdx = body.search(/\n###\s+Mini-diálogo/i);
  if (miniIdx === -1) {
    return { beforeMini: body.trim(), miniSection: "" };
  }
  return {
    beforeMini: body.slice(0, miniIdx).trim(),
    miniSection: body.slice(miniIdx).trim(),
  };
}

function extractGlossSection(beforeMini) {
  const m = beforeMini.match(/###\s+Traduções das frases[^\n]*\n([\s\S]*)/i);
  if (!m) return { headingLine: "### Traduções das frases (PT)", glossPT: [] };
  const rest = m[1];
  const nextH = rest.search(/\n###\s+/);
  const glossBody = nextH === -1 ? rest : rest.slice(0, nextH);
  const glossPT = parseListLines(glossBody);
  return { headingLine: "### Traduções das frases (PT)", glossPT };
}

function rebuildMiniSection(miniSection, turnsWithLoc) {
  const lines = miniSection.split("\n");
  const out = [];
  let ti = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    const bullet = trimmed.match(/^-\s+(.+)$/);
    if (bullet && turnsWithLoc[ti]) {
      const t = turnsWithLoc[ti];
      out.push(
        `- ${t.speaker} | ${t.hanzi} | ${t.pinyin} | ${t.pt} | ${t.en} | ${t.es}`,
      );
      ti++;
    } else {
      out.push(line);
    }
  }
  return out.join("\n");
}

function buildBlockMarkdown(blockId, beforeMini, miniSection, loc) {
  const { glossPT } = extractGlossSection(beforeMini);
  const turns = parseDialogueTurns(miniSection);
  if (loc.dialogueEN.length !== turns.length || loc.dialogueES.length !== turns.length) {
    throw new Error(
      `Block ${blockId}: dialogue count ${turns.length} vs EN ${loc.dialogueEN.length} ES ${loc.dialogueES.length}`,
    );
  }
  const turnsWithLoc = turns.map((t, i) => ({
    ...t,
    en: loc.dialogueEN[i],
    es: loc.dialogueES[i],
  }));

  const enLines = loc.glossEN.map((g) => `- ${g}`).join("\n");
  const esLines = loc.glossES.map((g) => `- ${g}`).join("\n");
  const ptLines = glossPT.map((g) => `- ${g}`).join("\n");

  let glossMd = `### Traduções das frases (PT)\n${ptLines}`;
  if (enLines) glossMd += `\n\n### Traduções das frases (EN)\n${enLines}`;
  if (esLines) glossMd += `\n\n### Traduções das frases (ES)\n${esLines}`;

  const newMini = rebuildMiniSection(miniSection, turnsWithLoc);

  return `${glossMd}\n\n${newMini}`;
}

function main() {
  const raw = fs.readFileSync(mdPath, "utf8");
  const locById = new Map(localeBlocks.map((b) => [b.id, b]));

  const header = raw.match(/^#[^\n]+\n+/)[0];
  const rest = raw.slice(header.length);
  const re = /^## (\d+)\s*$/gm;
  const hits = [];
  let m;
  while ((m = re.exec(rest)) !== null) {
    hits.push({ id: parseInt(m[1], 10), index: m.index, len: m[0].length });
  }

  const parts = [header];
  for (let i = 0; i < hits.length; i++) {
    const { id, index, len } = hits[i];
    const start = index + len;
    const end = i + 1 < hits.length ? hits[i + 1].index : rest.length;
    const body = rest.slice(start, end).trim();
    const loc = locById.get(id);
    if (!loc) throw new Error(`No locale data for block ${id}`);

    const { beforeMini, miniSection } = splitBlockBody(body);
    const blockMd = buildBlockMarkdown(id, beforeMini, miniSection, loc);
    parts.push(`## ${id}\n\n${blockMd}\n`);
  }

  fs.writeFileSync(mdPath, parts.join("\n"), "utf8");
  console.log(`Updated ${mdPath}`);
}

main();
