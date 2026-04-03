"use client";

import { ChineseWithPinyinLine } from "@/components/ChineseWithPinyinLine";
import { useLocale } from "@/context/LocaleContext";
import { useTranslationDisplay } from "@/context/TranslationContext";
import type { StructureGlossesByLocale, StructureLine } from "@/lib/blocks";
import { pickLocalized } from "@/lib/localized-line";

type Props = {
  blockId: number;
  lines: StructureLine[];
  structureGlosses: StructureGlossesByLocale;
};

export function ReviewStructures({ blockId, lines, structureGlosses }: Props) {
  const { t, locale } = useLocale();
  const { showTranslation } = useTranslationDisplay();

  if (lines.length === 0) return null;

  return (
    <div>
      <h2
        className="mb-8 text-xs font-semibold uppercase tracking-widest text-ink/40"
        style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
      >
        {t("review.structuresTitle")}
      </h2>

      <ul className="space-y-8">
        {lines.map((line, i) => {
          const L = {
            pt: structureGlosses.pt[i] ?? "",
            en: structureGlosses.en[i] ?? "",
            es: structureGlosses.es[i] ?? "",
          };
          const gloss = pickLocalized(L, locale);
          return (
            <li
              key={`${blockId}-${i}`}
              className="border-l-2 pl-5"
              style={{ borderColor: "var(--border)" }}
            >
              <ChineseWithPinyinLine hanzi={line.hanzi} pinyin={line.pinyin} />
              {showTranslation && gloss.trim() ? (
                <p
                  className="mt-2 text-sm leading-snug text-ink/50"
                  style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
                >
                  {gloss}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
