"use client";

import { resolvePieceDisplay, type RevealState } from "@/lib/phrase-game/display";
import type { DisplaySettings, Piece } from "@/lib/phrase-game/types";

type Props = {
  piece: Piece;
  settings: DisplaySettings;
  reveal: RevealState;
  /** Visual emphasis when the piece is in the answer strip. */
  inAnswer?: boolean;
  /** Correct / wrong styling applied after a submit. */
  state?: "neutral" | "correct" | "wrong";
};

/** Presentational piece content (hanzi + optional pinyin / gloss). No interactivity. */
export function PieceContent({ piece, settings, reveal, inAnswer, state = "neutral" }: Props) {
  const { showPinyin, showTranslation } = resolvePieceDisplay(piece, settings, reveal);

  const border =
    state === "correct"
      ? "var(--accent)"
      : state === "wrong"
        ? "#b91c1c"
        : "var(--border)";
  const bg =
    state === "correct"
      ? "rgba(45,90,140,0.08)"
      : state === "wrong"
        ? "rgba(185,28,28,0.06)"
        : inAnswer
          ? "rgba(45,90,140,0.04)"
          : "var(--paper)";

  return (
    <span
      className="inline-flex flex-col items-center justify-center rounded-xl border px-3 py-2 text-center leading-tight"
      style={{ borderColor: border, backgroundColor: bg, minWidth: "2.75rem" }}
    >
      {showPinyin && piece.pinyin ? (
        <span
          className="font-ruby text-[0.65rem] text-ink/55"
          style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
        >
          {piece.pinyin}
        </span>
      ) : null}
      <span className="font-hanzi text-xl text-ink">{piece.hanzi}</span>
      {showTranslation && piece.pt ? (
        <span
          className="mt-0.5 max-w-[8rem] truncate text-[0.6rem] text-ink/50"
          style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
          title={piece.pt}
        >
          {piece.pt}
        </span>
      ) : null}
    </span>
  );
}
