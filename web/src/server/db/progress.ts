/**
 * Player progress (server-only) — Phase 2 of the phrase game, shared with the quiz.
 *
 * Two tables, two jobs:
 * - `game_rounds`: one row per finished round. Answers "how did I do last time?".
 * - `progress`:    one row per (user, game, item). Answers "what should I review?".
 *
 * Signed-in players only. Guests keep the `anonId` event log (see `events.ts`);
 * nothing here is written for them, which is what the cookie banner promises.
 */
import { getDb } from "./index";

/** Which game an item belongs to. Item ids are only unique within a game. */
export type GameKind = "phrase" | "quiz";

export type ItemResult = {
  itemId: string;
  correct: boolean;
  /** Weighted points in [0, 1]; the quiz has no weighting, so it sends 0 or 1. */
  score: number;
};

export type RoundInput = {
  userId: string;
  game: GameKind;
  /** Groups this round with its rows in the `events` log. */
  roundId?: string | null;
  tier?: string | null;
  level?: number | null;
  items: ItemResult[];
};

export type RoundRow = {
  game: GameKind;
  tier: string | null;
  level: number | null;
  total: number;
  correct: number;
  points: number;
  createdAt: string;
};

export type GameSummary = {
  rounds: number;
  itemsSeen: number;
  /** Items whose most recent answer was wrong — the review queue. */
  itemsToReview: number;
  bestPoints: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Record a finished round: one `game_rounds` row plus the per-item tally.
 * Written in a transaction — a half-recorded round would corrupt the review
 * queue, which is the whole point of the table.
 */
export function recordRound(input: RoundInput): void {
  const db = getDb();
  const items = input.items.filter((i) => typeof i.itemId === "string" && i.itemId.length > 0);
  const correct = items.filter((i) => i.correct).length;
  const points = round2(items.reduce((sum, i) => sum + (Number.isFinite(i.score) ? i.score : 0), 0));

  const insertRound = db.prepare(
    `INSERT INTO game_rounds (user_id, game, round_id, tier, level, total, correct, points)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const upsertItem = db.prepare(
    `INSERT INTO progress
       (user_id, game, item_id, attempts, correct, best_score, last_score, last_correct, last_seen_at)
     VALUES (?, ?, ?, 1, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(user_id, game, item_id) DO UPDATE SET
       attempts     = attempts + 1,
       correct      = correct + excluded.correct,
       best_score   = MAX(best_score, excluded.best_score),
       last_score   = excluded.last_score,
       last_correct = excluded.last_correct,
       last_seen_at = datetime('now')`,
  );

  db.exec("BEGIN");
  try {
    insertRound.run(
      input.userId,
      input.game,
      input.roundId ?? null,
      input.tier ?? null,
      input.level ?? null,
      items.length,
      correct,
      points,
    );
    for (const item of items) {
      const score = Number.isFinite(item.score) ? item.score : 0;
      upsertItem.run(
        input.userId,
        input.game,
        item.itemId,
        item.correct ? 1 : 0,
        score,
        score,
        item.correct ? 1 : 0,
      );
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

export function recentRounds(userId: string, limit = 5): RoundRow[] {
  return getDb()
    .prepare(
      `SELECT game, tier, level, total, correct, points, created_at AS createdAt
         FROM game_rounds
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT ?`,
    )
    .all(userId, limit) as RoundRow[];
}

export function gameSummary(userId: string, game: GameKind): GameSummary {
  const db = getDb();
  const rounds = db
    .prepare(`SELECT COUNT(*) AS n, COALESCE(MAX(points), 0) AS best
                FROM game_rounds WHERE user_id = ? AND game = ?`)
    .get(userId, game) as { n: number; best: number };
  const items = db
    .prepare(`SELECT COUNT(*) AS seen,
                     COALESCE(SUM(CASE WHEN last_correct = 0 THEN 1 ELSE 0 END), 0) AS review
                FROM progress WHERE user_id = ? AND game = ?`)
    .get(userId, game) as { seen: number; review: number };

  return {
    rounds: rounds.n,
    bestPoints: round2(rounds.best),
    itemsSeen: items.seen,
    itemsToReview: items.review,
  };
}

/**
 * Item ids the player last got wrong, oldest first — so a review round revisits
 * what has been left alone longest rather than what was just missed.
 */
export function itemsToReview(userId: string, game: GameKind, limit = 50): string[] {
  const rows = getDb()
    .prepare(
      `SELECT item_id AS itemId
         FROM progress
        WHERE user_id = ? AND game = ? AND last_correct = 0
        ORDER BY last_seen_at ASC
        LIMIT ?`,
    )
    .all(userId, game, limit) as { itemId: string }[];
  return rows.map((r) => r.itemId);
}
