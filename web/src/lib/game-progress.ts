"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

/**
 * Client side of Phase 2 persistence, shared by the phrase game and the quiz.
 *
 * Everything here is best-effort: a failed write must never interrupt play, and
 * a guest getting 401 is the expected case, not an error. Guests keep the
 * `anonId` event log (`game-log.ts`); nothing is stored against them.
 */

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
/** The static export has no route handlers, so there is nothing to persist to. */
const ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED !== "0";
const ROUND_URL = `${BASE_PATH}/api/game/round`;
const PROGRESS_URL = `${BASE_PATH}/api/game/progress`;

export type GameKind = "phrase" | "quiz";

export type RoundItemResult = {
  itemId: string;
  correct: boolean;
  /** Weighted points in [0, 1]. Omitted means 1 for correct, 0 for wrong. */
  score?: number;
};

export type FinishedRound = {
  game: GameKind;
  roundId?: string;
  tier?: string;
  level?: number;
  items: RoundItemResult[];
};

export type GameSummary = {
  rounds: number;
  itemsSeen: number;
  itemsToReview: number;
  bestPoints: number;
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

export type ProgressResponse = {
  nick: string | null;
  phrase: GameSummary;
  quiz: GameSummary;
  recentRounds: RoundRow[];
};

/**
 * Persist a finished round. Fire-and-forget: the server recomputes the score,
 * so nothing here is trusted, and a 401 (guest) is silently fine.
 */
export function recordFinishedRound(round: FinishedRound): void {
  if (!ENABLED || typeof window === "undefined" || round.items.length === 0) return;
  try {
    void fetch(ROUND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      keepalive: true,
      body: JSON.stringify(round),
    }).catch(() => {});
  } catch {
    /* ignore — persistence must never break gameplay */
  }
}

export type ProgressState = {
  data: ProgressResponse | null;
  /** True once the request settled, whatever the outcome. */
  loaded: boolean;
  reload: () => void;
};

/**
 * The signed-in player's progress, or null for a guest. `reload` is called after
 * a round so the setup screen reflects what just happened.
 */

/** Static export has no SessionProvider, so `useSession` must never be reached. */
function usePlayerProgressDisabled(): ProgressState {
  return { data: null, loaded: true, reload: () => {} };
}

function usePlayerProgressLive(): ProgressState {
  // Gate on the session rather than letting every guest page-load fire a request
  // that can only ever come back 401.
  const { status } = useSession();
  const [data, setData] = useState<ProgressResponse | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated") {
      setData(null);
      setLoaded(true);
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(PROGRESS_URL, { credentials: "same-origin" });
        // 401 just means "playing as a guest".
        const next = res.ok ? ((await res.json()) as ProgressResponse) : null;
        if (!cancelled) setData(next);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [nonce, status]);

  return { data, loaded, reload };
}

/**
 * Picked once at module load, never per render: `ENABLED` is a build-time
 * constant, so this is a stable choice and not a conditional hook.
 */
export const usePlayerProgress: () => ProgressState = ENABLED
  ? usePlayerProgressLive
  : usePlayerProgressDisabled;
