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
