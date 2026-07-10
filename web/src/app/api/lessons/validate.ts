/** Shared validation for the curator lesson API (server-only). */
import { classExists } from "@/server/db/classes";
import type { LessonInput, LessonWordInput, MaterialRef } from "@/server/db/lessons";

const BOOKS = new Set(["primary-up", "primary-down"]);
const MAX_WORDS = 200;
const MAX_REFS = 20;

export function invalid(field: string): Response {
  return Response.json({ error: "invalid_input", field }, { status: 400 });
}

/** Parses and validates a lesson payload; returns a Response (400) on failure. */
export function parseLessonInput(body: unknown): LessonInput | Response {
  const b = (body ?? {}) as Record<string, unknown>;

  const lessonDate = typeof b.lessonDate === "string" ? b.lessonDate : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(lessonDate)) return invalid("lessonDate");

  const classId = typeof b.classId === "string" ? b.classId : "";
  if (!classId || !classExists(classId)) return invalid("classId");

  const notes = typeof b.notes === "string" ? b.notes : null;

  const rawRefs = Array.isArray(b.materialRefs) ? b.materialRefs : [];
  if (rawRefs.length > MAX_REFS) return invalid("materialRefs");
  const materialRefs: MaterialRef[] = [];
  for (const raw of rawRefs) {
    const ref = (raw ?? {}) as Record<string, unknown>;
    const book = typeof ref.book === "string" ? ref.book : "";
    const chapter = typeof ref.chapter === "number" ? ref.chapter : NaN;
    if (!BOOKS.has(book) || !Number.isInteger(chapter) || chapter < 1 || chapter > 16) {
      return invalid("materialRefs");
    }
    materialRefs.push({ book: book as MaterialRef["book"], chapter });
  }

  const rawWords = Array.isArray(b.words) ? b.words : [];
  if (rawWords.length > MAX_WORDS) return invalid("words");
  const words: LessonWordInput[] = [];
  for (const raw of rawWords) {
    const w = (raw ?? {}) as Record<string, unknown>;
    const hanzi = typeof w.hanzi === "string" ? w.hanzi.trim() : "";
    if (!hanzi) continue;
    words.push({
      hanzi,
      pinyin: typeof w.pinyin === "string" ? w.pinyin.trim() : null,
      translation: typeof w.translation === "string" ? w.translation.trim() : null,
      notes: typeof w.notes === "string" ? w.notes.trim() : null,
      theme: typeof w.theme === "string" ? w.theme.trim() : null,
    });
  }
  // Product rule (docs/12 §4): a lesson without words has little value.
  if (words.length === 0) return invalid("words");

  return { lessonDate, classId, notes, materialRefs, words };
}
