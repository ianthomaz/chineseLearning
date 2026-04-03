"use client";

import { ChineseWithPinyinLine } from "@/components/ChineseWithPinyinLine";
import { PriorityList } from "@/components/PriorityList";
import { useLocale } from "@/context/LocaleContext";
import type { StructureLine } from "@/lib/blocks";

type Props = {
  blockId: number;
  structures: StructureLine[];
  notes: string[];
  differences: string[];
  priorities: string[];
};

function Section({
  title,
  items,
  accent,
}: {
  title: string;
  items: string[];
  accent?: string;
}) {
  if (items.length === 0) return null;
  return (
    <section
      className="rounded-xl border p-5 sm:p-6"
      style={{ borderColor: "var(--border)" }}
    >
      <h2
        className="mb-4 text-xs font-semibold uppercase tracking-widest"
        style={{
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          color: accent ?? "rgba(28,25,23,0.4)",
        }}
      >
        {title}
      </h2>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li
            key={`${title}-${i}`}
            className="text-sm leading-relaxed text-ink/80"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function StructuresSection({
  title,
  lines,
  accent,
}: {
  title: string;
  lines: StructureLine[];
  accent?: string;
}) {
  if (lines.length === 0) return null;
  return (
    <section
      className="rounded-xl border p-5 sm:p-6"
      style={{ borderColor: "var(--border)" }}
    >
      <h2
        className="mb-4 text-xs font-semibold uppercase tracking-widest"
        style={{
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          color: accent ?? "rgba(28,25,23,0.4)",
        }}
      >
        {title}
      </h2>
      <ul className="space-y-4">
        {lines.map((line, i) => (
          <li key={`${title}-struct-${i}`}>
            <ChineseWithPinyinLine
              hanzi={line.hanzi}
              pinyin={line.pinyin}
              hanziClassName="font-hanzi text-xl leading-loose text-ink md:text-2xl"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function GrammarSections({
  blockId,
  structures,
  notes,
  differences,
  priorities,
}: Props) {
  const { t } = useLocale();

  const hasAnything =
    structures.length + notes.length + differences.length + priorities.length > 0;

  if (!hasAnything) {
    return <p className="text-sm text-ink/50">{t("grammar.empty")}</p>;
  }

  return (
    <div className="space-y-4">
      <StructuresSection
        title={t("grammar.structures")}
        lines={structures}
        accent="var(--accent)"
      />
      <Section title={t("grammar.notes")} items={notes} />
      <Section
        title={t("grammar.differences")}
        items={differences}
        accent="var(--accent-warm)"
      />
      {blockId === 15 && priorities.length > 0 ? (
        <PriorityList
          items={priorities}
          blockId={15}
          studyMode="grammar"
          variant="card"
        />
      ) : (
        <Section title={t("grammar.priorities")} items={priorities} />
      )}
    </div>
  );
}
