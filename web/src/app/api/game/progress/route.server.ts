/**
 * Player progress API — SERVER MODE.
 *
 * Selected by `next.config` `pageExtensions` only when NEXT_STATIC_EXPORT is unset.
 * MVP: reads/writes only the player's nick on the SQLite `players` table. It does NOT
 * persist round scores yet — that is Phase 2 (see docs/phrase-game-scoring.md). The static
 * export build picks `route.export.ts` (501 stub) instead.
 */
import { auth } from "@/server/auth";
import { getPlayer, setNick, upsertPlayer } from "@/server/db/players";

export async function GET() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return Response.json({ error: "unauthenticated" }, { status: 401 });
  const player = getPlayer(id);
  return Response.json({ nick: player?.nick ?? null });
}

export async function POST(req: Request) {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return Response.json({ error: "unauthenticated" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { nick?: unknown };
  upsertPlayer({
    id,
    email: session.user?.email,
    name: session.user?.name,
    image: session.user?.image,
  });
  if (typeof body.nick === "string") {
    setNick(id, body.nick.trim().slice(0, 24));
  }
  return Response.json({ ok: true, nick: getPlayer(id)?.nick ?? null });
}
