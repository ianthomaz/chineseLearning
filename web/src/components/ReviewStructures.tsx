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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl text-ink">Frases e padrões</h2>
        <button
          type="button"
          onClick={toggle}
          className="text-xs uppercase tracking-widest text-ink/50 underline decoration-ink/20 underline-offset-4 hover:text-ink"
        >
          {showExtra ? "Só chinês" : "Mostrar camada extra"}
        </button>
      </div>
      {showExtra ? (
        <p className="mb-8 max-w-2xl text-sm leading-relaxed text-ink/55">
          As traduções palavra a palavra estão no modo Vocabulário; as regras e observações,
          no modo Gramática. Aqui o foco é leitura com pinyin integrado à fonte quando o glifo
          existir na fonte. Bloco {blockId}.
        </p>
      ) : null}
      <ul className="space-y-10">
        {lines.map((line, i) => (
          <li key={`${blockId}-${i}`}>
            <p className="font-ruby text-2xl leading-relaxed text-ink md:text-[1.65rem]">
              {line}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
