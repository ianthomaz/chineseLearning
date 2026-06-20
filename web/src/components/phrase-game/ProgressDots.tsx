"use client";

import { ROUND_SIZE } from "@/lib/phrase-game/types";

export type DotState = "pending" | "correct" | "wrong" | "current";

type Props = {
  results: Array<"correct" | "wrong" | null>;
  currentIndex: number;
};

/** 2 rows × 5 circles. Empty = pending, green = correct, red = wrong. */
export function ProgressDots({ results, currentIndex }: Props) {
  const dots: DotState[] = Array.from({ length: ROUND_SIZE }, (_, i) => {
    if (results[i] === "correct") return "correct";
    if (results[i] === "wrong") return "wrong";
    if (i === currentIndex) return "current";
    return "pending";
  });

  const color = (s: DotState) =>
    s === "correct"
      ? "#15803d"
      : s === "wrong"
        ? "#b91c1c"
        : s === "current"
          ? "var(--accent)"
          : "transparent";

  return (
    <div className="grid grid-cols-5 gap-2" style={{ width: "fit-content" }} aria-hidden>
      {dots.map((s, i) => (
        <span
          key={i}
          className="h-3 w-3 rounded-full border"
          style={{
            borderColor: s === "pending" ? "var(--border)" : color(s),
            backgroundColor: s === "current" ? "transparent" : color(s),
            boxShadow: s === "current" ? "0 0 0 2px rgba(45,90,140,0.25)" : "none",
          }}
        />
      ))}
    </div>
  );
}
