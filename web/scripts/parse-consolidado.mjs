/**
 * Reads Content/consolidado_final.md and writes src/data/consolidado.json
 * Strips narrative intros (paragraphs before the first ### in each block).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const mdPath = path.join(root, "Content", "consolidado_final.md");
const outPath = path.join(__dirname, "..", "src", "data", "consolidado.json");

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
    rows.push({
      hanzi: cells[0],
      pinyin: cells[1],
      translation: cells[2],
    });
  }
  return rows;
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
  const id = Number(hm[1], 10);
  const title = hm[2].trim();

  const firstSection = body.indexOf("\n### ");
  const rest =
    firstSection === -1 ? "" : body.slice(firstSection + 1).trimStart();

  const sections = splitSections(rest);

  const block = {
    id,
    title,
    structures: [],
    notes: [],
    differences: [],
    priorities: [],
    vocabulary: [],
  };

  for (const { heading, lines } of sections) {
    const h = heading.toLowerCase();
    if (h.includes("estruturas centrais")) {
      block.structures = parseListLines(lines);
    } else if (h.includes("observa")) {
      block.notes = parseListLines(lines);
    } else if (h.includes("diferen")) {
      block.differences = parseListLines(lines);
    } else if (h.includes("prioridades")) {
      block.priorities = parseListLines(lines);
    } else if (h.includes("vocabul")) {
      block.vocabulary = parseTable(lines);
    }
  }

  return { block };
}

function main() {
  const raw = fs.readFileSync(mdPath, "utf8");
  const withoutH1 = raw.replace(/^#[^\n]*\n+/, "").replace(/^## /, "");
  const chunks = withoutH1.split(/\n## /).filter(Boolean);

  const blocks = [];
  for (const chunk of chunks) {
    const lines = chunk.split("\n");
    const headerLine = lines[0];
    const body = lines.slice(1).join("\n");
    const parsed = parseBlock(headerLine, body);
    if (parsed) blocks.push(parsed.block);
  }

  blocks.sort((a, b) => a.id - b.id);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({ blocks }, null, 2), "utf8");
  console.log(`Wrote ${blocks.length} blocks to ${outPath}`);
}

main();
