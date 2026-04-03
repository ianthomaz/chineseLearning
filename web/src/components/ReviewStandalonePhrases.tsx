"use client";

import { useLocale } from "@/context/LocaleContext";
import type { StructureGlossesByLocale } from "@/lib/blocks";
import { pickLocalized } from "@/lib/localized-line";

type Props = {
  phrases: StructureGlossesByLocale;
  /** When set (e.g. block 15), uses clearer copy for recap-only lists. */
  blockId?: number;
};

/** Recap lines in PT/EN/ES only (no hanzi) — always shown in the active UI language. */
export function ReviewStandalonePhrases({ phrases, blockId }: Props) {
  const { t, locale } = useLocale();

  const count = Math.max(
    phrases.pt.length,
    phrases.en.length,
    phrases.es.length,
  );
  if (count === 0) return null;

  return (
    <section className="mb-14">
      <h2
        className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink/40"
        style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
      >
        {blockId === 15
          ? t("review.standalonePhrasesTitleFinal")
          : t("review.standalonePhrasesTitle")}
      </h2>
      <p
        className="mb-6 text-sm leading-relaxed text-ink/50"
        style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
      >
        {blockId === 15
          ? t("review.standalonePhrasesHintFinal")
          : t("review.standalonePhrasesHint")}
      </p>
      <ul className="space-y-3">
        {Array.from({ length: count }, (_, i) => {
          const L = {
            pt: phrases.pt[i] ?? "",
            en: phrases.en[i] ?? "",
            es: phrases.es[i] ?? "",
          };
          const line = pickLocalized(L, locale);
          if (!line.trim()) return null;
          return (
            <li
              key={i}
              className="border-l-2 pl-4 text-sm leading-relaxed text-ink"
              style={{
                borderColor: "var(--border)",
                fontFamily: "ui-sans-serif, system-ui, sans-serif",
              }}
            >
              {line}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
