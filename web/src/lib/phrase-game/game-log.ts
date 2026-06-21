/**
 * Client-side game event logger.
 *
 * Posts gameplay events (entries, round start, per-phrase results, help usage,
 * abandons, completions) to the server `events` API. Server-mode only — gated on
 * NEXT_PUBLIC_AUTH_ENABLED (the static export has no API, so it no-ops there).
 *
 * Best-effort and non-blocking: failures are swallowed, and `keepalive` lets
 * abandon events flush during page unload / SPA navigation.
 */
import type { GameLevel, GameTier } from "./types";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED !== "0";
const ENDPOINT = `${BASE_PATH}/api/game/events`;
const ANON_KEY = "pg_anon_id";

export type GameEventName =
  | "game_enter"
  | "round_start"
  | "phrase_result"
  | "help_used"
  | "round_abandon"
  | "round_complete";

export type GameEventData = {
  roundId: string;
  tier: GameTier;
  level: GameLevel;
  phraseId: string;
  correct: boolean;
  attempt: string;
  /** Free-form extra: help action, "7/10" score, "reached:3/10", etc. */
  detail: string;
};

/** Stable per-browser anonymous id (so guest play can be grouped). */
function anonId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.localStorage.getItem(ANON_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

/** New unique id grouping all events of one round. */
export function newRoundId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export function logGameEvent(event: GameEventName, data: Partial<GameEventData> = {}): void {
  if (!ENABLED || typeof window === "undefined") return;
  const locale = document.documentElement.lang || undefined;
  const body = JSON.stringify({ event, anonId: anonId(), locale, ...data });
  try {
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => {});
  } catch {
    /* ignore — telemetry must never break gameplay */
  }
}
