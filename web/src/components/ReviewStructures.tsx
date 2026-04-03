"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "chineseLearning:reviewExtraLayer";

type Props = {
  blockId: number;
  lines: string[];
};

export function ReviewStructures({ blockId, lines }: Props) {
  const [showExtra, setShowExtra] = useState(true);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "0") setShowExtra(false);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setShowExtra((s) => {
      const next = !s;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  if (lines.length === 0) return null;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h2
          className="text-xs font-semibold uppercase tracking-widest text-ink/40"
          style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
        >
          Frases e padrões
        </h2>
        <button
          type="button"
          onClick={toggle}
          className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors hover:bg-ink/5"
          style={{
            borderColor: "var(--border)",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
            color: showExtra ? "var(--accent)" : "rgba(28,25,23,0.5)",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: showExtra ? "var(--accent)" : "rgba(28,25,23,0.25)" }}
          />
          {showExtra ? "Com pinyin" : "Só caracteres"}
        </button>
      </div>

      <ul className="space-y-8">
        {lines.map((line, i) => (
          <li key={`${blockId}-${i}`} className="border-l-2 pl-5" style={{ borderColor: "var(--border)" }}>
            <p
              className={
                showExtra
                  ? "font-ruby text-2xl leading-loose text-ink md:text-[1.7rem]"
                  : "font-hanzi text-2xl leading-loose text-ink md:text-[1.7rem]"
              }
            >
              {line}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
