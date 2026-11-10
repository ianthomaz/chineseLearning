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

/**
 * Squashed canonical schema (nov 2026). New DBs get the final shape in one
 * CREATE. Existing DBs keep upgrading via the migrate* helpers below — those
 * stay idempotent so we never need a growing folder of numbered migrations.
 */
const MIGRATION = `
CREATE TABLE IF NOT EXISTS users (
  id                 TEXT PRIMARY KEY,
  email              TEXT,
  name               TEXT,
  image              TEXT,
  nick               TEXT,
  password_hash      TEXT,
  email_verified_at  TEXT,
  clearance          TEXT NOT NULL DEFAULT 'O1',
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(lower(email));

-- Per-item mastery, for signed-in players only. One row per (user, game, item):
-- the running tally, not a log; the blow-by-blow lives in the events table.
-- game is 'phrase' | 'quiz' | 'hanzi'; item_id unique within that game.
CREATE TABLE IF NOT EXISTS progress (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      TEXT NOT NULL,
  game         TEXT NOT NULL,
  item_id      TEXT NOT NULL,
  attempts     INTEGER NOT NULL DEFAULT 0,
  correct      INTEGER NOT NULL DEFAULT 0,
  best_score   REAL NOT NULL DEFAULT 0,
  last_score   REAL NOT NULL DEFAULT 0,
  last_correct INTEGER NOT NULL DEFAULT 0,
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, game, item_id)
);
CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id, game);
CREATE INDEX IF NOT EXISTS idx_progress_review ON progress(user_id, game, last_correct);
CREATE INDEX IF NOT EXISTS idx_progress_review_order ON progress(user_id, game, last_correct, last_seen_at);

-- One row per finished round or quiz. Drives "your last round" and history.
CREATE TABLE IF NOT EXISTS game_rounds (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT NOT NULL,
  game       TEXT NOT NULL,
  round_id   TEXT,
  tier       TEXT,
  level      INTEGER,
  total      INTEGER NOT NULL,
  correct    INTEGER NOT NULL,
  points     REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_rounds_user ON game_rounds(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_rounds_user_game ON game_rounds(user_id, game);

-- Identity (docs/05_autenticacao.md § Contas). A user can sign in through
-- several providers; each (provider, provider_account_id) points at one user.
-- provider: 'google' | 'apple' | 'alipay' (union_id, or legacy open_id) | 'email'.
CREATE TABLE IF NOT EXISTS accounts (
  provider            TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  user_id             TEXT NOT NULL,
  email               TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (provider, provider_account_id)
);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);

-- Alipay: open_id is per APPID; union_id is the shared person key.
-- accounts.provider_account_id for alipay is the union_id when known.
CREATE TABLE IF NOT EXISTS alipay_open_ids (
  app_id     TEXT NOT NULL,
  open_id    TEXT NOT NULL,
  union_id   TEXT,
  user_id    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (app_id, open_id)
);
CREATE INDEX IF NOT EXISTS idx_alipay_open_ids_union ON alipay_open_ids(union_id);
CREATE INDEX IF NOT EXISTS idx_alipay_open_ids_user ON alipay_open_ids(user_id);

-- iOS app sessions: opaque bearer token, only its SHA-256 is stored.
CREATE TABLE IF NOT EXISTS app_sessions (
  token_hash   TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL,
  client       TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  last_used_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_app_sessions_user ON app_sessions(user_id);

-- One-time codes after Alipay (or similar) ASWebAuthenticationSession on iOS.
-- App opens /api/auth/alipay/start?client=ios → callback redirects to the app
-- scheme with ?exchange=… → POST /api/app/auth/alipay consumes it for a Bearer.
CREATE TABLE IF NOT EXISTS app_auth_exchanges (
  code_hash  TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_app_auth_exchanges_user ON app_auth_exchanges(user_id);

-- One-time links sent by email. purpose: 'verify' | 'reset'. Only the hash is stored.
-- password_hash: present on signup verify links until the email is opened.
CREATE TABLE IF NOT EXISTS email_tokens (
  token_hash     TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL,
  email          TEXT NOT NULL,
  purpose        TEXT NOT NULL,
  expires_at     TEXT NOT NULL,
  used_at        TEXT,
  password_hash  TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_email_tokens_user ON email_tokens(user_id);

-- NOIA audit, append-only (same shape as noia.dev): every change of users.clearance.
-- source: 'migration' | 'signup' | 'email_verified' | 'oauth_signup' | 'password_reset' | 'admin'.
CREATE TABLE IF NOT EXISTS clearance_changes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT NOT NULL,
  from_cl    TEXT,
  to_cl      TEXT NOT NULL,
  source     TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_clearance_changes_user ON clearance_changes(user_id);

CREATE INDEX IF NOT EXISTS idx_rounds_user_round ON game_rounds(user_id, round_id);

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
CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id);

-- Lesson registry, eixo B (docs/09_roadmap_integracoes.md). Curator-only.
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

-- Editorial content (docs/07_conteudo_dados.md). Runtime source when CONTENT_SOURCE=db.
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

-- Context flashcard decks (/practice). SQL is source of truth.
CREATE TABLE IF NOT EXISTS context_decks (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS context_deck_cards (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  deck_id          TEXT NOT NULL REFERENCES context_decks(id) ON DELETE CASCADE,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  word             TEXT NOT NULL,
  pinyin           TEXT NOT NULL DEFAULT '',
  meaning          TEXT NOT NULL DEFAULT '',
  section          TEXT,
  pattern          TEXT,
  pattern_label    TEXT,
  sentence         TEXT,
  sentence_pinyin  TEXT,
  sentence_meaning TEXT,
  related          TEXT,
  patterns         TEXT,
  notes            TEXT
);
CREATE INDEX IF NOT EXISTS idx_cdc_deck ON context_deck_cards(deck_id);

-- Shared lexicon for appMobile (and future API).
CREATE TABLE IF NOT EXISTS lexico_rotation_categories (
  id               TEXT PRIMARY KEY,
  title            TEXT NOT NULL,
  source_block_ids TEXT NOT NULL DEFAULT '[]',
  sort_order       INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lexico_entries (
  id                   TEXT PRIMARY KEY,
  hanzi                TEXT NOT NULL,
  pinyin               TEXT NOT NULL DEFAULT '',
  translation          TEXT NOT NULL DEFAULT '',
  hanzi_length         INTEGER NOT NULL,
  source_block_id      INTEGER NOT NULL,
  source_block_title   TEXT NOT NULL DEFAULT '',
  rotation_category_id TEXT NOT NULL REFERENCES lexico_rotation_categories(id) ON DELETE CASCADE,
  sort_order           INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_lexico_hanzi ON lexico_entries(hanzi);
CREATE INDEX IF NOT EXISTS idx_lexico_rotation ON lexico_entries(rotation_category_id);
`;

/**
 * Old DBs may still have the pre-game stub `(user_id, phrase_id, score)`.
 * Replace it so CREATE TABLE IF NOT EXISTS can install the canonical shape.
 * Non-empty stubs are renamed once; empty leftovers are dropped below.
 */
function migrateProgressStub(database: DatabaseSync): void {
  const columns = database
    .prepare(`PRAGMA table_info(progress)`)
    .all() as { name: string }[];
  if (columns.length === 0 || columns.some((c) => c.name === "game")) return;

  const { n } = database.prepare(`SELECT COUNT(*) AS n FROM progress`).get() as {
    n: number;
  };
  if (n > 0) {
    console.warn(`[db] progress stub has ${n} rows — kept as progress_legacy`);
    database.exec(`ALTER TABLE progress RENAME TO progress_legacy`);
  } else {
    database.exec(`DROP TABLE progress`);
  }
}

/**
 * Identity columns on `users` / `email_tokens` for DBs created before the
 * squash. Predating Google-only users get an `accounts` row and released
 * clearance, audited as 'migration'.
 */
function migrateIdentity(database: DatabaseSync): void {
  const tokenColumns = (
    database.prepare(`PRAGMA table_info(email_tokens)`).all() as { name: string }[]
  ).map((c) => c.name);
  if (tokenColumns.length > 0 && !tokenColumns.includes("password_hash")) {
    database.exec(`ALTER TABLE email_tokens ADD COLUMN password_hash TEXT`);
  }
  const columns = new Set(
    (database.prepare(`PRAGMA table_info(users)`).all() as { name: string }[]).map(
      (c) => c.name,
    ),
  );
  if (!columns.has("password_hash")) {
    database.exec(`ALTER TABLE users ADD COLUMN password_hash TEXT`);
  }
  if (!columns.has("email_verified_at")) {
    database.exec(`ALTER TABLE users ADD COLUMN email_verified_at TEXT`);
  }
  if (columns.has("clearance")) return;

  database.exec(`ALTER TABLE users ADD COLUMN clearance TEXT NOT NULL DEFAULT 'O1'`);
  database.exec("BEGIN");
  try {
    database.exec(
      `INSERT OR IGNORE INTO accounts (provider, provider_account_id, user_id, email)
       SELECT 'google', id, id, email FROM users`,
    );
    database.exec(
      `INSERT INTO clearance_changes (user_id, from_cl, to_cl, source)
       SELECT id, 'O1', 'O4', 'migration' FROM users`,
    );
    database.exec(
      `UPDATE users SET clearance = 'O4', email_verified_at = COALESCE(email_verified_at, created_at)`,
    );
    database.exec("COMMIT");
  } catch (err) {
    database.exec("ROLLBACK");
    throw err;
  }
}

/**
 * Fold legacy `players` into `users`, keep a compatibility VIEW named
 * `players`, then drop `players_legacy` / empty `progress_legacy`.
 */
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

  const legacy = database
    .prepare(`SELECT type FROM sqlite_master WHERE name = 'players_legacy'`)
    .get() as { type: string } | undefined;
  if (legacy?.type === "table") {
    database.exec(
      `INSERT OR IGNORE INTO users (id, email, name, image, nick, created_at, updated_at)
       SELECT id, email, name, image, nick, created_at, updated_at FROM players_legacy`,
    );
    database.exec(`DROP TABLE players_legacy`);
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

  const progressLegacy = database
    .prepare(`SELECT type FROM sqlite_master WHERE name = 'progress_legacy'`)
    .get() as { type: string } | undefined;
  if (progressLegacy?.type === "table") {
    const { n } = database
      .prepare(`SELECT COUNT(*) AS n FROM progress_legacy`)
      .get() as { n: number };
    if (n === 0) {
      database.exec(`DROP TABLE progress_legacy`);
    }
  }
}

export function getDb(): DatabaseSync {
  if (db) return db;
  const path = dbPath();
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }
  db = new DatabaseSync(path);
  db.exec(
    "PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;",
  );
  // Reshape before the schema runs, so CREATE TABLE IF NOT EXISTS takes hold.
  migrateProgressStub(db);
  db.exec(MIGRATION);
  migratePlayersToUsers(db);
  migrateIdentity(db);
  return db;
}
