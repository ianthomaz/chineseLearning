import type { DialogueTurn } from "@/lib/blocks-types";
import type { LocalizedLine } from "@/lib/localized-line";

export type GlobalDialogueSection = {
  id: string;
  categoryId?: number;
  lines: DialogueTurn[];
};

export type RawDialogueLine = {
  speaker: string;
  hanzi: string;
  pinyin: string;
  translation: string | LocalizedLine;
};

export type RawDialogueSection = {
  id: string;
  categoryId?: number;
  lines: RawDialogueLine[];
};

export function normalizeDialogueTurn(line: RawDialogueLine): DialogueTurn {
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

export function mapDialogueSection(sec: RawDialogueSection): GlobalDialogueSection {
  return {
    id: sec.id,
    ...(typeof sec.categoryId === "number" ? { categoryId: sec.categoryId } : {}),
    lines: sec.lines.map(normalizeDialogueTurn),
  };
}
