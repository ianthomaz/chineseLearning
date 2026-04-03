"use client";

import { usePinyin } from "@/context/PinyinContext";

type Props = {
  blockId: number;
  lines: string[];
};

export function ReviewStructures({ blockId, lines }: Props) {
  const { showPinyin } = usePinyin();

  if (lines.length === 0) return null;

  return (
    <div>
      <h2
        className="mb-8 text-xs font-semibold uppercase tracking-widest text-ink/40"
        style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
      >
        Frases e padrões
      </h2>

      <ul className="space-y-8">
        {lines.map((line, i) => (
          <li
            key={`${blockId}-${i}`}
            className="border-l-2 pl-5"
            style={{ borderColor: "var(--border)" }}
          >
            <p
              className={
                showPinyin
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
