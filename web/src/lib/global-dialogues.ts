import raw from "@/data/global-dialogues.json";
import extra from "@/data/global-dialogues-extra.json";
import type { DialogueTurn } from "@/lib/blocks";
import type { LocalizedLine } from "@/lib/localized-line";

export type GlobalDialogueSection = {
  id: string;
  /** Matches `ContentBlock.id` (1–15) for category filter on /dialogues */
  categoryId?: number;
  lines: DialogueTurn[];
};

type RawLine = {
  speaker: string;
  hanzi: string;
  pinyin: string;
  translation: string | LocalizedLine;
};

type RawSection = { id: string; categoryId?: number; lines: RawLine[] };
type RawFile = { sections: RawSection[] };

function normalizeTurn(line: RawLine): DialogueTurn {
  const tr = line.translation;
  if (typeof tr === "object" && tr !== null && "pt" in tr) {
    const o = tr as LocalizedLine;
    return {
      speaker: line.speaker,
      hanzi: line.hanzi,
      pinyin: line.pinyin,
      translation: {
        pt: o.pt ?? "",
        en: o.en ?? "",
        es: o.es ?? "",
      },
    };
  }
  const s = typeof tr === "string" ? tr : "";
  return {
    speaker: line.speaker,
    hanzi: line.hanzi,
    pinyin: line.pinyin,
    translation: { pt: s, en: s, es: s },
  };
}

function mapSection(sec: RawSection): GlobalDialogueSection {
  return {
    id: sec.id,
    ...(typeof sec.categoryId === "number" ? { categoryId: sec.categoryId } : {}),
    lines: sec.lines.map(normalizeTurn),
  };
}

const mergedSections = [
  ...(raw as RawFile).sections,
  ...(extra as RawFile).sections,
];

export const globalDialogueSections: GlobalDialogueSection[] =
  mergedSections.map(mapSection);
