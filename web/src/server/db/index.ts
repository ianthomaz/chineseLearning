/**
 * SQLite connection for player / progress data (server-only).
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
  return process.env.PHRASE_GAME_DB ?? join(process.cwd(), "data", "phrase-game.sqlite");
}

const MIGRATION = `
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

export function getDb(): DatabaseSync {
  if (db) return db;
  const path = dbPath();
  mkdirSync(dirname(path), { recursive: true });
  db = new DatabaseSync(path);
  db.exec(MIGRATION);
  return db;
}
