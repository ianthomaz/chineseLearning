/**
 * SQLite connection for site users, game events, and progress (server-only).
 *
 * Uses Node's built-in `node:sqlite` (Node ≥ 22.5) — no native build step.
 * The connection is opened lazily so importing this module never touches the
 * filesystem (safe during static-export builds, where it is never invoked).
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

let db: DatabaseSync | null = null;

function dbPath(): string {
  return (
    process.env.SITE_DB ??
    process.env.PHRASE_GAME_DB ??
    join(process.cwd(), "data", "phrase-game.sqlite")
  );
}

const MIGRATION = `
CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  email      TEXT,
  name       TEXT,
  image      TEXT,
  nick       TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS players (
  id         TEXT PRIMARY KEY,
  email      TEXT,
  name       TEXT,
  image      TEXT,
  nick       TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Phase 2 (stub, not written yet): per-phrase round results.
CREATE TABLE IF NOT EXISTS progress (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT NOT NULL,
  phrase_id  TEXT NOT NULL,
  score      REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Game event log: entries, round starts, per-phrase results, help usage,
-- abandons and completions. Works for logged-in (user_id) and anonymous
-- (anon_id) players. Read by the owner backoffice.
CREATE TABLE IF NOT EXISTS events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  event      TEXT NOT NULL,
  user_id    TEXT,
  anon_id    TEXT,
  round_id   TEXT,
  tier       TEXT,
  level      INTEGER,
  phrase_id  TEXT,
  correct    INTEGER,
  attempt    TEXT,
  detail     TEXT,
  locale     TEXT,
  user_agent TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_event ON events(event);
CREATE INDEX IF NOT EXISTS idx_events_round ON events(round_id);

-- Lesson registry, eixo B (docs/12_aula_registro_roadmap.md). Curator-only.
CREATE TABLE IF NOT EXISTS classes (
  id         TEXT PRIMARY KEY,
  label      TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active     INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT OR IGNORE INTO classes (id, label, sort_order) VALUES
  ('confucio-b1',        'Confúcio B1',        1),
  ('confucio-b2',        'Confúcio B2',        2),
  ('prepely-chenyang',   'Prepely Chenyang',   3),
  ('x-mandarin-t3',      'X-Mandarin T3',      4),
  ('x-mandarin-privado', 'X-Mandarin Privado', 5);

CREATE TABLE IF NOT EXISTS lessons (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_date TEXT NOT NULL,
  class_id    TEXT NOT NULL REFERENCES classes(id),
  notes       TEXT,
  created_by  TEXT NOT NULL REFERENCES users(id),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_lessons_date  ON lessons(lesson_date);
CREATE INDEX IF NOT EXISTS idx_lessons_class ON lessons(class_id);

-- Optional book+chapter references (0..N per lesson). Chapter is a book
-- unit (课), never called "aula" in the UI.
CREATE TABLE IF NOT EXISTS lesson_material_refs (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  book      TEXT NOT NULL CHECK (book IN ('primary-up','primary-down')),
  chapter   INTEGER NOT NULL CHECK (chapter BETWEEN 1 AND 16)
);
CREATE INDEX IF NOT EXISTS idx_lmr_lesson ON lesson_material_refs(lesson_id);

-- Words the curator highlighted in one lesson, with per-lesson context.
CREATE TABLE IF NOT EXISTS lesson_vocab_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id   INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL DEFAULT 0,
  hanzi       TEXT NOT NULL,
  pinyin      TEXT,
  translation TEXT,
  notes       TEXT,
  theme       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_lvi_lesson ON lesson_vocab_items(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lvi_hanzi  ON lesson_vocab_items(hanzi);

-- Site-wide accumulated lexicon. Key is the EXACT hanzi string (no
-- normalisation). Upserted on lesson save; never deleted automatically.
CREATE TABLE IF NOT EXISTS lexicon_global (
  hanzi       TEXT PRIMARY KEY,
  pinyin      TEXT,
  translation TEXT,
  theme       TEXT,
  first_seen_lesson_id INTEGER REFERENCES lessons(id) ON DELETE SET NULL,
  seen_count  INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Editorial content (docs/11). Runtime source when CONTENT_SOURCE=db.
-- payload_json holds the full ContentBlock for faithful round-trip.
CREATE TABLE IF NOT EXISTS content_blocks (
  id         INTEGER PRIMARY KEY,
  title      TEXT NOT NULL,
  narrative  TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vocab_entries (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  block_id    INTEGER NOT NULL REFERENCES content_blocks(id) ON DELETE CASCADE,
  hanzi       TEXT NOT NULL,
  pinyin      TEXT NOT NULL DEFAULT '',
  translation TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_vocab_block ON vocab_entries(block_id);
CREATE INDEX IF NOT EXISTS idx_vocab_hanzi ON vocab_entries(hanzi);

CREATE TABLE IF NOT EXISTS structure_lines (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  block_id   INTEGER NOT NULL REFERENCES content_blocks(id) ON DELETE CASCADE,
  hanzi      TEXT NOT NULL,
  pinyin     TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_structure_block ON structure_lines(block_id);

CREATE TABLE IF NOT EXISTS structure_glosses (
  structure_id INTEGER NOT NULL REFERENCES structure_lines(id) ON DELETE CASCADE,
  locale       TEXT NOT NULL CHECK (locale IN ('pt','en','es')),
  gloss        TEXT NOT NULL,
  PRIMARY KEY (structure_id, locale)
);

CREATE TABLE IF NOT EXISTS block_notes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  block_id   INTEGER NOT NULL REFERENCES content_blocks(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS block_differences (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  block_id   INTEGER NOT NULL REFERENCES content_blocks(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS block_priorities (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  block_id   INTEGER NOT NULL REFERENCES content_blocks(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS review_standalone_phrases (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  block_id   INTEGER NOT NULL REFERENCES content_blocks(id) ON DELETE CASCADE,
  locale     TEXT NOT NULL CHECK (locale IN ('pt','en','es')),
  body       TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS dialogue_conversations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  block_id   INTEGER NOT NULL REFERENCES content_blocks(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS dialogue_turns (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES dialogue_conversations(id) ON DELETE CASCADE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  speaker         TEXT NOT NULL DEFAULT '',
  hanzi           TEXT NOT NULL DEFAULT '',
  pinyin          TEXT NOT NULL DEFAULT '',
  translation_pt  TEXT NOT NULL DEFAULT '',
  translation_en  TEXT NOT NULL DEFAULT '',
  translation_es  TEXT NOT NULL DEFAULT ''
);

-- Phrase game bank
CREATE TABLE IF NOT EXISTS phrase_game_phrases (
  id           TEXT PRIMARY KEY,
  nivel        INTEGER NOT NULL,
  tier         TEXT NOT NULL,
  payload_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pgp_tier ON phrase_game_phrases(tier);
CREATE INDEX IF NOT EXISTS idx_pgp_nivel ON phrase_game_phrases(nivel);

-- Gamification quiz (full bank as one row + per-question rows)
CREATE TABLE IF NOT EXISTS quiz_bank_meta (
  id           INTEGER PRIMARY KEY CHECK (id = 1),
  payload_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS quiz_questions (
  id           INTEGER PRIMARY KEY,
  type         TEXT NOT NULL,
  difficulty   INTEGER NOT NULL DEFAULT 1,
  block        INTEGER,
  payload_json TEXT NOT NULL
);

-- Global dialogues page
CREATE TABLE IF NOT EXISTS global_dialogue_sections (
  id           TEXT PRIMARY KEY,
  category_id  INTEGER,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL
);

-- Visual PDF catalog (binaries stay on disk)
CREATE TABLE IF NOT EXISTS visual_pdf_entries (
  id           TEXT PRIMARY KEY,
  file         TEXT NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL
);

-- Eixo A: book chapter lexicon
CREATE TABLE IF NOT EXISTS books (
  id           TEXT PRIMARY KEY,
  volume_label TEXT NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO books (id, volume_label, sort_order) VALUES
  ('primary-up',   '初级·上', 1),
  ('primary-down', '初级·下', 2);

CREATE TABLE IF NOT EXISTS book_vocab_entries (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id    TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  lesson     INTEGER NOT NULL CHECK (lesson BETWEEN 1 AND 16),
  source     TEXT NOT NULL CHECK (source IN ('text','extension','produce')),
  hanzi      TEXT NOT NULL,
  pinyin     TEXT,
  pos        TEXT,
  gloss_en   TEXT,
  examples_json TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_bve_book_lesson ON book_vocab_entries(book_id, lesson);
CREATE INDEX IF NOT EXISTS idx_bve_hanzi ON book_vocab_entries(hanzi);
`;

/** One-time: copy legacy `players` rows into `users`, then expose `players` as a view. */
function migratePlayersToUsers(database: DatabaseSync): void {
  const playersObj = database
    .prepare(`SELECT type FROM sqlite_master WHERE name = 'players'`)
    .get() as { type: string } | undefined;

  if (playersObj?.type === "table") {
    database.exec(
      `INSERT OR IGNORE INTO users (id, email, name, image, nick, created_at, updated_at)
       SELECT id, email, name, image, nick, created_at, updated_at FROM players`,
    );
    database.exec(`ALTER TABLE players RENAME TO players_legacy`);
  }

  const playersAfter = database
    .prepare(`SELECT type FROM sqlite_master WHERE name = 'players'`)
    .get() as { type: string } | undefined;

  if (!playersAfter) {
    database.exec(
      `CREATE VIEW players AS
       SELECT id, email, name, image, nick, created_at, updated_at FROM users`,
    );
  }
}

export function getDb(): DatabaseSync {
  if (db) return db;
  const path = dbPath();
  mkdirSync(dirname(path), { recursive: true });
  db = new DatabaseSync(path);
  db.exec(MIGRATION);
  migratePlayersToUsers(db);
  return db;
}
