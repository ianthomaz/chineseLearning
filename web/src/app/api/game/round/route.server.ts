/**
 * Finished-round API — SERVER MODE (`route.server.ts`; absent under static export).
 *
 * Records what a signed-in player just played, for both the phrase game and the
 * quiz. Guests get a 401 and keep their `anonId` event log instead — nothing is
 * stored against them, which is what the cookie banner says.
 *
 * The score is recomputed here from the per-item results: the client decides
 * whether an item was right, but it does not get to state its own total.
 */
import { auth } from "@/server/auth";
import { rateLimit } from "@/server/rate-limit";
import { recordRound, type GameKind, type ItemResult } from "@/server/db/progress";
import { upsertUser } from "@/server/db/users";

export const dynamic = "force-dynamic";

const GAMES = new Set<GameKind>(["phrase", "quiz"]);

/** A round is 10 phrases; the quiz is longer. Enough headroom, no abuse. */
const MAX_ITEMS = 100;

type RawBody = {
  game?: unknown;
  roundId?: unknown;
  tier?: unknown;
  level?: unknown;
  items?: unknown;
};

function parseItems(raw: unknown): ItemResult[] {
  if (!Array.isArray(raw)) return [];
  const items: ItemResult[] = [];
  for (const entry of raw.slice(0, MAX_ITEMS)) {
    if (!entry || typeof entry !== "object") continue;
    const { itemId, correct, score } = entry as Record<string, unknown>;
    if (typeof itemId !== "string" || itemId.length === 0) continue;
    items.push({
      itemId: itemId.slice(0, 64),
      correct: correct === true,
      // Clamped: a client cannot inflate its own score.
      score: typeof score === "number" && Number.isFinite(score)
        ? Math.min(1, Math.max(0, score))
        : correct === true
          ? 1
          : 0,
    });
  }
  return items;
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return Response.json({ error: "unauthenticated" }, { status: 401 });

  // A round takes minutes to play; this only sheds scripted floods.
  if (!rateLimit(`round:${userId}`, 60, 60_000)) {
    return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as RawBody | null;
  const game = body?.game;
  if (typeof game !== "string" || !GAMES.has(game as GameKind)) {
    return Response.json({ error: "unknown_game" }, { status: 400 });
  }

  const items = parseItems(body?.items);
  if (items.length === 0) {
    return Response.json({ error: "no_items" }, { status: 400 });
  }

  // The row is only written on a finished round, so this is also the first
  // moment we are sure the player exists — sign-in may predate the users table.
  upsertUser({
    id: userId,
    email: session.user?.email,
    name: session.user?.name,
    image: session.user?.image,
  });

  try {
    recordRound({
      userId,
      game: game as GameKind,
      roundId: typeof body?.roundId === "string" ? body.roundId.slice(0, 64) : null,
      tier: typeof body?.tier === "string" ? body.tier.slice(0, 32) : null,
      level: typeof body?.level === "number" ? body.level : null,
      items,
    });
  } catch (err) {
    console.warn("[round] failed to record", err);
    return Response.json({ ok: false }, { status: 500 });
  }

  return Response.json({ ok: true, recorded: items.length });
}
