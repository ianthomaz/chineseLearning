import { statSync } from "node:fs";
import { join } from "node:path";
import { getDb } from "./index";
import { isReleased } from "../auth/noia";

export const ALLOWED_OBSERVER_TABLES = [
  "users",
  "accounts",
  "alipay_open_ids",
  "app_sessions",
  "progress",
  "game_rounds",
  "events",
  "classes",
  "lessons",
  "lesson_material_refs",
  "lesson_vocab_items",
  "lexicon_global",
  "content_blocks",
  "practice_blocks",
] as const;

export type AllowedObserverTable = (typeof ALLOWED_OBSERVER_TABLES)[number];

function getDbFileSize(): number | null {
  try {
    const dbFile =
      process.env.SITE_DB ??
      process.env.PHRASE_GAME_DB ??
      join(process.cwd(), "data", "phrase-game.sqlite");
    return statSync(dbFile).size;
  } catch {
    return null;
  }
}

export function getObserverOverview() {
  const db = getDb();

  const countTable = (table: string): number => {
    try {
      const row = db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number } | undefined;
      return row?.count ?? 0;
    } catch {
      return 0;
    }
  };

  const tableCounts = Object.fromEntries(
    ALLOWED_OBSERVER_TABLES.map((t) => [t, countTable(t)])
  ) as Record<AllowedObserverTable, number>;

  // Weekly stats (last 7 days)
  const weeklyEvents = db
    .prepare(
      `SELECT event, COUNT(*) AS n
         FROM events
        WHERE created_at >= datetime('now', '-7 days')
        GROUP BY event`
    )
    .all() as Array<{ event: string; n: number }>;
  const weeklyByEvent = new Map(weeklyEvents.map((r) => [r.event, r.n]));

  const weeklyResults = db
    .prepare(
      `SELECT COALESCE(SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END), 0) AS correct,
              COALESCE(SUM(CASE WHEN correct = 0 THEN 1 ELSE 0 END), 0) AS wrong
         FROM events
        WHERE event = 'phrase_result' AND created_at >= datetime('now', '-7 days')`
    )
    .get() as { correct: number; wrong: number };

  const weeklyUsers = db
    .prepare(
      `SELECT COUNT(DISTINCT user_id) AS activeUsers
         FROM events
        WHERE user_id IS NOT NULL AND created_at >= datetime('now', '-7 days')`
    )
    .get() as { activeUsers: number };

  const newUsersWeekly = db
    .prepare(
      `SELECT COUNT(*) AS newUsers
         FROM users
        WHERE created_at >= datetime('now', '-7 days')`
    )
    .get() as { newUsers: number };

  // Recent errors / abandons
  const recentErrors = db
    .prepare(
      `SELECT e.id, e.created_at, e.event, e.user_id, e.round_id, e.tier, e.level, e.detail,
              u.nick, u.email
         FROM events e
         LEFT JOIN users u ON u.id = e.user_id
        WHERE e.event = 'round_abandon' OR e.detail LIKE '%error%'
        ORDER BY e.id DESC
        LIMIT 25`
    )
    .all();

  // Top missed phrases in the past 7 days
  const topMissedWeek = db
    .prepare(
      `SELECT phrase_id,
              SUM(CASE WHEN correct = 0 THEN 1 ELSE 0 END) AS wrong,
              COUNT(*) AS total
         FROM events
        WHERE event = 'phrase_result' AND phrase_id IS NOT NULL
          AND created_at >= datetime('now', '-7 days')
        GROUP BY phrase_id
       HAVING wrong > 0
        ORDER BY wrong DESC, total DESC
        LIMIT 5`
    )
    .all();

  // Latest 20 events (sanitized)
  const recentEvents = db
    .prepare(
      `SELECT e.id, e.created_at, e.event, e.user_id, e.round_id, e.tier, e.level,
              e.phrase_id, e.correct, e.locale, u.nick
         FROM events e
         LEFT JOIN users u ON u.id = e.user_id
        ORDER BY e.id DESC
        LIMIT 20`
    )
    .all();

  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    database: {
      sizeBytes: getDbFileSize(),
      tables: tableCounts,
    },
    weeklySummary: {
      period: "last_7_days",
      totalEvents: weeklyEvents.reduce((acc, r) => acc + r.n, 0),
      roundsStarted: weeklyByEvent.get("round_start") ?? 0,
      roundsCompleted: weeklyByEvent.get("round_complete") ?? 0,
      roundsAbandoned: weeklyByEvent.get("round_abandon") ?? 0,
      phraseResults: {
        correct: weeklyResults.correct,
        wrong: weeklyResults.wrong,
        accuracyPct:
          weeklyResults.correct + weeklyResults.wrong > 0
            ? Math.round(
                (weeklyResults.correct / (weeklyResults.correct + weeklyResults.wrong)) * 1000
              ) / 10
            : null,
      },
      activeUsers: weeklyUsers?.activeUsers ?? 0,
      newUsers: newUsersWeekly?.newUsers ?? 0,
      topMissedPhrases: topMissedWeek,
    },
    recentErrors,
    recentEvents,
    allowedTables: ALLOWED_OBSERVER_TABLES,
  };
}

export function getObserverTable(tableName: string, options: { limit?: number; offset?: number } = {}) {
  if (!ALLOWED_OBSERVER_TABLES.includes(tableName as AllowedObserverTable)) {
    return { error: "table_not_allowed" };
  }

  const limit = Math.min(Math.max(1, Math.floor(options.limit ?? 50)), 200);
  const offset = Math.max(0, Math.floor(options.offset ?? 0));
  const db = getDb();

  const total = (db.prepare(`SELECT COUNT(*) AS n FROM ${tableName}`).get() as { n: number })?.n ?? 0;

  let query: string;
  switch (tableName as AllowedObserverTable) {
    case "users":
      // Explicitly omit password_hash and internal NOIA clearance; provide functional released flag
      query = `SELECT id, email, name, image, nick, email_verified_at, clearance, created_at, updated_at
                 FROM users ORDER BY id DESC LIMIT ? OFFSET ?`;
      break;
    case "app_sessions":
      // Omit raw token_hash, only show prefix for diagnostics
      query = `SELECT substr(token_hash, 1, 8) || '...' AS token_prefix, user_id, client, created_at, last_used_at, expires_at
                 FROM app_sessions ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      break;
    default:
      query = `SELECT * FROM ${tableName} ORDER BY rowid DESC LIMIT ? OFFSET ?`;
      break;
  }

  let rows = db.prepare(query).all(limit, offset) as Record<string, unknown>[];

  if (tableName === "users") {
    rows = rows.map((u) => {
      const clearance = String(u.clearance ?? "");
      const copy = { ...u };
      delete copy.clearance;
      return {
        ...copy,
        released: isReleased(clearance),
      };
    });
  }

  return {
    table: tableName,
    total,
    limit,
    offset,
    rows,
  };
}
