/**
 * Game event log (server-only): entries, abandons, per-phrase results, help
 * usage, and completions — for logged-in (`user_id`) and anonymous (`anon_id`)
 * players. Backs the owner backoffice at `/backoffice`.
 */
import { getDb } from "./index";

export type GameEventName =
  | "game_enter"
  | "round_start"
  | "phrase_result"
  | "help_used"
  | "round_abandon"
  | "round_complete";

export type EventInput = {
  event: GameEventName;
  userId?: string | null;
  anonId?: string | null;
  roundId?: string | null;
  tier?: string | null;
  level?: number | null;
  phraseId?: string | null;
  correct?: boolean | null;
  attempt?: string | null;
  detail?: string | null;
  locale?: string | null;
  userAgent?: string | null;
};

/** Trim a value to a string column (or null). */
function str(v: unknown, max = 300): string | null {
  return typeof v === "string" && v.length > 0 ? v.slice(0, max) : null;
}

export function recordEvent(input: EventInput): void {
  getDb()
    .prepare(
      `INSERT INTO events
         (event, user_id, anon_id, round_id, tier, level, phrase_id, correct, attempt, detail, locale, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.event,
      str(input.userId, 64),
      str(input.anonId, 64),
      str(input.roundId, 64),
      str(input.tier, 32),
      typeof input.level === "number" ? input.level : null,
      str(input.phraseId, 64),
      input.correct === null || input.correct === undefined ? null : input.correct ? 1 : 0,
      str(input.attempt, 200),
      str(input.detail, 80),
      str(input.locale, 8),
      str(input.userAgent, 300),
    );
}

/** A recent-events row, joined to the player's nick/email when logged in. */
export type EventRow = {
  id: number;
  created_at: string;
  event: string;
  user_id: string | null;
  anon_id: string | null;
  round_id: string | null;
  tier: string | null;
  level: number | null;
  phrase_id: string | null;
  correct: number | null;
  attempt: string | null;
  detail: string | null;
  locale: string | null;
  user_agent: string | null;
  nick: string | null;
  email: string | null;
};

export function recentEvents(limit = 200): EventRow[] {
  const n = Math.min(Math.max(1, Math.floor(limit)), 1000);
  return getDb()
    .prepare(
      `SELECT e.id, e.created_at, e.event, e.user_id, e.anon_id, e.round_id, e.tier,
              e.level, e.phrase_id, e.correct, e.attempt, e.detail, e.locale, e.user_agent,
              p.nick AS nick, p.email AS email
         FROM events e
         LEFT JOIN players p ON p.id = e.user_id
        ORDER BY e.id DESC
        LIMIT ?`,
    )
    .all(n) as EventRow[];
}

export type EventStats = {
  total: number;
  last24h: number;
  byEvent: Array<{ event: string; n: number }>;
  rounds: number;
  completes: number;
  abandons: number;
  correct: number;
  wrong: number;
  players: number;
  guests: number;
};

export function eventStats(): EventStats {
  const db = getDb();
  const count = (sql: string): number => {
    const row = db.prepare(sql).get() as { n: number } | undefined;
    return row?.n ?? 0;
  };
  const byEvent = db
    .prepare(`SELECT event, COUNT(*) AS n FROM events GROUP BY event ORDER BY n DESC`)
    .all() as Array<{ event: string; n: number }>;
  return {
    total: count(`SELECT COUNT(*) AS n FROM events`),
    last24h: count(`SELECT COUNT(*) AS n FROM events WHERE created_at >= datetime('now','-1 day')`),
    byEvent,
    rounds: count(`SELECT COUNT(*) AS n FROM events WHERE event='round_start'`),
    completes: count(`SELECT COUNT(*) AS n FROM events WHERE event='round_complete'`),
    abandons: count(`SELECT COUNT(*) AS n FROM events WHERE event='round_abandon'`),
    correct: count(`SELECT COUNT(*) AS n FROM events WHERE event='phrase_result' AND correct=1`),
    wrong: count(`SELECT COUNT(*) AS n FROM events WHERE event='phrase_result' AND correct=0`),
    players: count(`SELECT COUNT(DISTINCT user_id) AS n FROM events WHERE user_id IS NOT NULL`),
    guests: count(`SELECT COUNT(DISTINCT anon_id) AS n FROM events WHERE anon_id IS NOT NULL`),
  };
}
