import raw from "@/data/global-dialogues.json";
import type { DialogueTurn } from "@/lib/blocks";
import type { LocalizedLine } from "@/lib/localized-line";

export type GlobalDialogueSection = {
  id: string;
  lines: DialogueTurn[];
};

type RawLine = {
  speaker: string;
  hanzi: string;
  pinyin: string;
  translation: string | LocalizedLine;
};

type RawFile = { sections: Array<{ id: string; lines: RawLine[] }> };

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

export const globalDialogueSections: GlobalDialogueSection[] = (
  raw as RawFile
).sections.map((sec) => ({
  id: sec.id,
  lines: sec.lines.map(normalizeTurn),
}));
