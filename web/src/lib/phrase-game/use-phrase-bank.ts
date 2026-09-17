"use client";

import { useEffect, useState } from "react";
import type { Phrase } from "./types";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const BANK_URL = `${BASE_PATH}/api/phrase-game/bank`;

export type BankStatus = "loading" | "ready" | "error";

export type PhraseBankState = {
  bank: Phrase[];
  status: BankStatus;
};

/**
 * The phrase bank, fetched in the background so it never blocks the first paint.
 *
 * `initial` is non-null only in the static export, which has no route handlers and
 * therefore still receives the bank as props (see `app/phrase-game/page.tsx`).
 */
export function usePhraseBank(initial: Phrase[] | null): PhraseBankState {
  const [bank, setBank] = useState<Phrase[]>(initial ?? []);
  const [status, setStatus] = useState<BankStatus>(initial ? "ready" : "loading");

  useEffect(() => {
    if (initial) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(BANK_URL, { credentials: "same-origin" });
        if (!res.ok) throw new Error(`bank ${res.status}`);
        const data = (await res.json()) as { phrases?: Phrase[] };
        if (cancelled) return;
        const phrases = data.phrases ?? [];
        setBank(phrases);
        setStatus(phrases.length > 0 ? "ready" : "error");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initial]);

  return { bank, status };
}
