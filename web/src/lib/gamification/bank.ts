import { getDb } from "@/server/db";
import { contentSource } from "@/lib/content/content-repository";
import type { QuizBank } from "./types";

function loadFromJson(): QuizBank {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("@/data/gamification/hsk1-quiz-bank.json") as QuizBank;
}

function loadFromDb(): QuizBank {
  const row = getDb()
    .prepare(`SELECT payload_json FROM quiz_bank_meta WHERE id = 1`)
    .get() as { payload_json: string } | undefined;
  if (!row) throw new Error("quiz_bank_meta empty — run npm run seed:content");
  return JSON.parse(String(row.payload_json)) as QuizBank;
}

const EMPTY_BANK: QuizBank = {
  version: "0",
  language: {
    source: "pt",
    targets: ["en", "es"],
    hanzi_field: "hanzi",
    pinyin_field: "pinyin",
  },
  metadata: {
    total_questions: 0,
    hsk_level: 1,
    blocks_covered: [],
  },
  question_types: {},
  questions: [],
};

/** Quiz bank: SQLite when CONTENT_SOURCE=db (no JSON fallback). */
export function getQuizBank(): QuizBank {
  if (contentSource() === "json") return loadFromJson();
  try {
    return loadFromDb();
  } catch (err) {
    console.warn("[quiz] DB read failed — run npm run seed:content", err);
    return EMPTY_BANK;
  }
}
