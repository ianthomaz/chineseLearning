"use client";

import Link from "next/link";
import {
  BLOCK_15_PRIORITY_TARGET_IDS,
  targetsForBlock15PriorityLine,
} from "@/lib/priorityLinks";

export type StudyMode = "review" | "vocabulary" | "grammar";

type Props = {
  items: string[];
  title?: string;
  /** When 15, priority lines link to their target blocks (same study mode). */
  blockId?: number;
  studyMode?: StudyMode;
  /** Card wrapper (e.g. inside grammar stack). */
  variant?: "plain" | "card";
};

export function PriorityList({
  items,
  title = "Prioridades",
  blockId = 0,
  studyMode = "review",
  variant = "plain",
}: Props) {
  if (items.length === 0) return null;

  const linkBlock15 =
    blockId === 15 &&
    items.length === BLOCK_15_PRIORITY_TARGET_IDS.length;

  const inner = (
    <>
      <h2
        className="mb-4 text-xs font-semibold uppercase tracking-widest text-ink/40"
        style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
      >
        {title}
      </h2>
      {linkBlock15 ? (
        <p className="mb-4 text-sm text-ink/50">
          Cada item abre o bloco correspondente neste mesmo modo (
          {studyMode === "review"
            ? "Revisão"
            : studyMode === "vocabulary"
              ? "Vocabulário"
              : "Gramática"}
          ).
        </p>
      ) : null}
      <ol className="space-y-3">
        {items.map((item, i) => {
          const targets = linkBlock15
            ? targetsForBlock15PriorityLine(i)
            : undefined;
          return (
            <li
              key={`${i}-${item}`}
              className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-3"
            >
              <div className="flex items-baseline gap-3">
                <span
                  className="w-5 shrink-0 text-right text-xs tabular-nums text-ink/30"
                  style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
                >
                  {i + 1}
                </span>
                <span className="text-sm text-ink/80">{item}</span>
              </div>
              {targets && targets.length > 0 ? (
                <span className="flex flex-wrap items-center gap-1.5 sm:pl-0 pl-8">
                  <span className="text-xs text-ink/35">→</span>
                  {targets.map((tid) => (
                    <Link
                      key={tid}
                      href={`/${studyMode}/${tid}`}
                      className="rounded-full border px-2.5 py-0.5 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
                      style={{
                        borderColor: "var(--border)",
                        fontFamily: "ui-sans-serif, system-ui, sans-serif",
                      }}
                    >
                      Bloco {tid}
                    </Link>
                  ))}
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </>
  );

  if (variant === "card") {
    return (
      <section
        className="rounded-xl border p-5 sm:p-6"
        style={{ borderColor: "var(--border)" }}
      >
        {inner}
      </section>
    );
  }

  return <section className="mt-10">{inner}</section>;
}
