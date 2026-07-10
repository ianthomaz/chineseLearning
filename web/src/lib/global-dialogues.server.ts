import { getDb } from "@/server/db";
import { contentSource } from "@/lib/content/content-repository";
import {
  mapDialogueSection,
  type GlobalDialogueSection,
  type RawDialogueSection,
} from "./global-dialogues";

function loadFromJson(): GlobalDialogueSection[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const raw = require("@/data/global-dialogues.json") as { sections: RawDialogueSection[] };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const extra = require("@/data/global-dialogues-extra.json") as {
    sections: RawDialogueSection[];
  };
  return [...raw.sections, ...extra.sections].map(mapDialogueSection);
}

function loadFromDb(): GlobalDialogueSection[] {
  const rows = getDb()
    .prepare(
      `SELECT payload_json FROM global_dialogue_sections ORDER BY sort_order ASC`,
    )
    .all() as { payload_json: string }[];
  return rows.map((r) =>
    mapDialogueSection(JSON.parse(r.payload_json) as RawDialogueSection),
  );
}

export function getGlobalDialogueSections(): GlobalDialogueSection[] {
  if (contentSource() === "json") return loadFromJson();
  try {
    const fromDb = loadFromDb();
    if (fromDb.length === 0) return loadFromJson();
    return fromDb;
  } catch {
    return loadFromJson();
  }
}
