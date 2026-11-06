"use client";

import { useEffect, useState } from "react";
import type { Phrase } from "./types";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
/** Server route — preferred (gzip + short cache). Public; no session needed. */
const BANK_API_URL = `${BASE_PATH}/api/phrase-game/bank`;
/**
 * Static copy from `prebuild:phrase-game` → `public/data/…`.
 * Fallback when the API is down, blocked, or the build is a static export
 * without props (guests must still be able to play).
 */
const BANK_STATIC_URL = `${BASE_PATH}/data/phrase-game-bank.json`;

export type BankStatus = "loading" | "ready" | "error";

export type PhraseBankState = {
  bank: Phrase[];
  status: BankStatus;
};

async function loadPhrases(url: string): Promise<Phrase[]> {
  const res = await fetch(url, { credentials: "omit", cache: "force-cache" });
  if (!res.ok) throw new Error(`bank ${res.status}`);
  const data = (await res.json()) as { phrases?: Phrase[] };
  return data.phrases ?? [];
}

/**
 * The phrase bank, fetched in the background so it never blocks the first paint.
 *
 * `initial` is non-null in the static export (no route handlers). In server mode
 * we try the API, then the public static file — never require login.
 */
export function usePhraseBank(initial: Phrase[] | null): PhraseBankState {
  const [bank, setBank] = useState<Phrase[]>(initial ?? []);
  const [status, setStatus] = useState<BankStatus>(initial ? "ready" : "loading");

  useEffect(() => {
    if (initial) return;
    let cancelled = false;

    (async () => {
      const urls = [BANK_API_URL, BANK_STATIC_URL];
      for (const url of urls) {
        try {
          const phrases = await loadPhrases(url);
          if (cancelled) return;
          if (phrases.length === 0) continue;
          setBank(phrases);
          setStatus("ready");
          return;
        } catch {
          // try next source
        }
      }
      if (!cancelled) setStatus("error");
    })();

    return () => {
      cancelled = true;
    };
  }, [initial]);

  return { bank, status };
}
