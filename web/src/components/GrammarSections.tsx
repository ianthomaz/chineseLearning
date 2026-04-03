"use client";

import { usePinyin } from "@/context/PinyinContext";
import { PriorityList } from "@/components/PriorityList";

type Props = {
  blockId: number;
  structures: string[];
  notes: string[];
  differences: string[];
  priorities: string[];
};

function Section({
  title,
  items,
  useChineseLine,
  showPinyin,
  accent,
}: {
  title: string;
  items: string[];
  useChineseLine?: boolean;
  showPinyin: boolean;
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
            className={
              useChineseLine
                ? showPinyin
                  ? "font-ruby text-xl leading-loose text-ink md:text-2xl"
                  : "font-hanzi text-xl leading-loose text-ink md:text-2xl"
                : "text-sm leading-relaxed text-ink/80"
            }
          >
            {item}
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
  const { showPinyin } = usePinyin();

  const hasAnything =
    structures.length + notes.length + differences.length + priorities.length > 0;

  if (!hasAnything) {
    return (
      <p className="text-sm text-ink/50">
        Não há notas de gramática neste bloco no consolidado.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <Section
        title="Estruturas e exemplos"
        items={structures}
        useChineseLine
        showPinyin={showPinyin}
        accent="var(--accent)"
      />
      <Section title="Observações" items={notes} showPinyin={showPinyin} />
      <Section
        title="Diferenças e contrastes"
        items={differences}
        showPinyin={showPinyin}
        accent="var(--accent-warm)"
      />
      {blockId === 15 && priorities.length > 0 ? (
        <PriorityList
          items={priorities}
          title="Prioridades"
          blockId={15}
          studyMode="grammar"
          variant="card"
        />
      ) : (
        <Section
          title="Prioridades"
          items={priorities}
          showPinyin={showPinyin}
        />
      )}
    </div>
  );
}
