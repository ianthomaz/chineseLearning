/**
 * Player progress API — SERVER MODE.
 *
 * GET returns the nick plus what the player has built up: a per-game summary and
 * the last few rounds. POST still only writes the nick; a finished round goes to
 * `/api/game/round`, which recomputes its own score.
 *
 * Under static export this route does not exist (`.server.ts` omitted).
 */
import { getRequestUser } from "@/server/auth/request-user";
import { getUser, setNick } from "@/server/db/users";
import { allGameSummaries, itemsToReview, recentRounds } from "@/server/db/progress";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  const id = user?.id;
  if (!user || !id) return Response.json({ error: "unauthenticated" }, { status: 401 });

  const summaries = allGameSummaries(id);
  return Response.json({
    nick: user.nick ?? null,
    phrase: summaries.phrase,
    quiz: summaries.quiz,
    hanzi: summaries.hanzi,
    recentRounds: recentRounds(id, 5),
    reviewPhraseIds: summaries.phrase.itemsToReview > 0 ? itemsToReview(id, "phrase") : [],
  });
}

export async function POST(req: Request) {
  const user = await getRequestUser(req);
  const id = user?.id;
  if (!user || !id) return Response.json({ error: "unauthenticated" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { nick?: unknown };
  if (typeof body.nick === "string") {
    setNick(id, body.nick.trim().slice(0, 24));
  }
  return Response.json({ ok: true, nick: getUser(id)?.nick ?? null });
}
