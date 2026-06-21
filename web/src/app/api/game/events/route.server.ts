/**
 * Game event log API — SERVER MODE (`route.server.ts`; absent under static export).
 *
 * Accepts a single event or a small batch from the client — logged-in OR guest —
 * and appends to the SQLite `events` table. Best-effort: it never throws to the
 * caller and never blocks gameplay. The user id (when signed in) is taken from the
 * session server-side; the client only supplies the anonymous id.
 */
import { auth } from "@/server/auth";
import { recordEvent, type EventInput, type GameEventName } from "@/server/db/events";
import { rateLimit } from "@/server/rate-limit";

export const dynamic = "force-dynamic";

const ALLOWED = new Set<GameEventName>([
  "game_enter",
  "round_start",
  "phrase_result",
  "help_used",
  "round_abandon",
  "round_complete",
]);

type RawEvent = {
  event?: unknown;
  anonId?: unknown;
  roundId?: unknown;
  tier?: unknown;
  level?: unknown;
  phraseId?: unknown;
  correct?: unknown;
  attempt?: unknown;
  detail?: unknown;
  locale?: unknown;
};

function normalize(raw: RawEvent, userId: string | null, userAgent: string | null): EventInput | null {
  if (typeof raw.event !== "string" || !ALLOWED.has(raw.event as GameEventName)) return null;
  return {
    event: raw.event as GameEventName,
    userId,
    anonId: typeof raw.anonId === "string" ? raw.anonId : null,
    roundId: typeof raw.roundId === "string" ? raw.roundId : null,
    tier: typeof raw.tier === "string" ? raw.tier : null,
    level: typeof raw.level === "number" ? raw.level : null,
    phraseId: typeof raw.phraseId === "string" ? raw.phraseId : null,
    correct: typeof raw.correct === "boolean" ? raw.correct : null,
    attempt: typeof raw.attempt === "string" ? raw.attempt : null,
    detail: typeof raw.detail === "string" ? raw.detail : null,
    locale: typeof raw.locale === "string" ? raw.locale : null,
    userAgent,
  };
}

export async function POST(req: Request) {
  // Shed scripted floods on this public, unauthenticated endpoint. A fast round
  // is ~15 events, so 240/min/IP is generous for real play but blocks abuse.
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`events:${ip}`, 240, 60_000)) {
    return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let userId: string | null = null;
  try {
    const session = await auth();
    userId = session?.user?.id ?? null;
  } catch {
    /* anonymous — fine */
  }

  const userAgent = req.headers.get("user-agent");
  const body = (await req.json().catch(() => null)) as { events?: RawEvent[] } | RawEvent | null;
  if (!body || typeof body !== "object") return Response.json({ ok: false }, { status: 400 });

  const list = Array.isArray((body as { events?: RawEvent[] }).events)
    ? (body as { events: RawEvent[] }).events
    : [body as RawEvent];

  let saved = 0;
  for (const raw of list.slice(0, 50)) {
    const ev = normalize(raw, userId, userAgent);
    if (!ev) continue;
    try {
      recordEvent(ev);
      saved += 1;
    } catch {
      /* best-effort: keep going */
    }
  }
  return Response.json({ ok: true, saved });
}
