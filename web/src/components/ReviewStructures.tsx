"use client";

import { PhraseRevealLine } from "@/components/PhraseRevealLine";
import { useLocale } from "@/context/LocaleContext";
import type { StructureGlossesByLocale, StructureLine } from "@/lib/blocks";
import { pickLocalized } from "@/lib/localized-line";

type Props = {
  blockId: number;
  lines: StructureLine[];
  structureGlosses: StructureGlossesByLocale;
};

export function ReviewStructures({ blockId, lines, structureGlosses }: Props) {
  const { t, locale } = useLocale();

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
              <PhraseRevealLine
                hanzi={line.hanzi}
                pinyin={line.pinyin}
                translation={gloss.trim()}
                hanziClassName="font-hanzi text-2xl leading-loose text-ink md:text-[1.7rem]"
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
