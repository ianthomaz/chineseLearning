/**
 * Lesson registry (server-only), eixo B of docs/12_aula_registro_roadmap.md.
 * A lesson is one real study session logged by the curator: date, class,
 * optional book/chapter refs, highlighted words and free notes.
 */
import { getDb } from "./index";
import { upsertLexiconEntry } from "./lexicon";

export type MaterialRef = {
  book: "primary-up" | "primary-down";
  chapter: number;
};

export type LessonWordInput = {
  hanzi: string;
  pinyin?: string | null;
  translation?: string | null;
  notes?: string | null;
  theme?: string | null;
};

export type LessonInput = {
  lessonDate: string;
  classId: string;
  notes?: string | null;
  materialRefs: MaterialRef[];
  words: LessonWordInput[];
};

export type LessonSummary = {
  id: number;
  lessonDate: string;
  classId: string;
  classLabel: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
};

export type LessonWord = {
  hanzi: string;
  pinyin: string | null;
  translation: string | null;
  notes: string | null;
  theme: string | null;
  position: number;
};

export type LessonDetail = {
  id: number;
  lessonDate: string;
  classId: string;
  classLabel: string;
  notes: string | null;
  materialRefs: MaterialRef[];
  words: LessonWord[];
  createdAt: string;
  updatedAt: string;
};

/** Trim a value to a string column (or null). */
function str(v: unknown, max = 300): string | null {
  return typeof v === "string" && v.length > 0 ? v.slice(0, max) : null;
}

function insertChildren(lessonId: number, input: LessonInput, bumpSeen: boolean): void {
  const db = getDb();
  const insertRef = db.prepare(
    `INSERT INTO lesson_material_refs (lesson_id, book, chapter) VALUES (?, ?, ?)`,
  );
  for (const ref of input.materialRefs) {
    insertRef.run(lessonId, ref.book, ref.chapter);
  }

  const insertWord = db.prepare(
    `INSERT INTO lesson_vocab_items (lesson_id, position, hanzi, pinyin, translation, notes, theme)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  input.words.forEach((word, position) => {
    const hanzi = str(word.hanzi, 64);
    if (!hanzi) return;
    insertWord.run(
      lessonId,
      position,
      hanzi,
      str(word.pinyin, 120),
      str(word.translation, 300),
      str(word.notes, 500),
      str(word.theme, 80),
    );
    upsertLexiconEntry(
      {
        hanzi,
        pinyin: str(word.pinyin, 120),
        translation: str(word.translation, 300),
        theme: str(word.theme, 80),
      },
      lessonId,
      bumpSeen,
    );
  });
}

export function createLesson(input: LessonInput, createdBy: string): number {
  const db = getDb();
  db.exec("BEGIN");
  try {
    const result = db
      .prepare(`INSERT INTO lessons (lesson_date, class_id, notes, created_by) VALUES (?, ?, ?, ?)`)
      .run(input.lessonDate, input.classId, str(input.notes, 2000), createdBy);
    const lessonId = Number(result.lastInsertRowid);
    insertChildren(lessonId, input, true);
    db.exec("COMMIT");
    return lessonId;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

/** Replace-all update: lesson fields plus every ref and word. False if the id is unknown. */
export function updateLesson(id: number, input: LessonInput): boolean {
  const db = getDb();
  db.exec("BEGIN");
  try {
    const result = db
      .prepare(
        `UPDATE lessons SET lesson_date = ?, class_id = ?, notes = ?, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .run(input.lessonDate, input.classId, str(input.notes, 2000), id);
    if (Number(result.changes) === 0) {
      db.exec("ROLLBACK");
      return false;
    }
    db.prepare(`DELETE FROM lesson_material_refs WHERE lesson_id = ?`).run(id);
    db.prepare(`DELETE FROM lesson_vocab_items WHERE lesson_id = ?`).run(id);
    insertChildren(id, input, false);
    db.exec("COMMIT");
    return true;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function getLesson(id: number): LessonDetail | null {
  const db = getDb();
  const lesson = db
    .prepare(
      `SELECT l.id, l.lesson_date AS lessonDate, l.class_id AS classId, c.label AS classLabel,
              l.notes, l.created_at AS createdAt, l.updated_at AS updatedAt
       FROM lessons l JOIN classes c ON c.id = l.class_id
       WHERE l.id = ?`,
    )
    .get(id) as Omit<LessonDetail, "materialRefs" | "words"> | undefined;
  if (!lesson) return null;

  const materialRefs = db
    .prepare(`SELECT book, chapter FROM lesson_material_refs WHERE lesson_id = ? ORDER BY id`)
    .all(id) as MaterialRef[];
  const words = db
    .prepare(
      `SELECT hanzi, pinyin, translation, notes, theme, position
       FROM lesson_vocab_items WHERE lesson_id = ? ORDER BY position, id`,
    )
    .all(id) as LessonWord[];

  return { ...lesson, materialRefs, words };
}

export function listLessons(limit = 200): LessonSummary[] {
  const n = Math.min(Math.max(1, Math.floor(limit)), 1000);
  return getDb()
    .prepare(
      `SELECT l.id, l.lesson_date AS lessonDate, l.class_id AS classId, c.label AS classLabel,
              (SELECT COUNT(*) FROM lesson_vocab_items v WHERE v.lesson_id = l.id) AS wordCount,
              l.created_at AS createdAt, l.updated_at AS updatedAt
       FROM lessons l JOIN classes c ON c.id = l.class_id
       ORDER BY l.lesson_date DESC, l.id DESC
       LIMIT ?`,
    )
    .all(n) as LessonSummary[];
}

/** Deletes the lesson (refs/words via cascade). Never touches lexicon_global (docs/12 §6). */
export function deleteLesson(id: number): boolean {
  const result = getDb().prepare(`DELETE FROM lessons WHERE id = ?`).run(id);
  return Number(result.changes) > 0;
}
