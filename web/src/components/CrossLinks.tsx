import Link from "next/link";

type Props = {
  blockId: number;
  current: "review" | "vocabulary" | "grammar";
};

const modeConfig = {
  review: { label: "Revisão", hanzi: "复习" },
  vocabulary: { label: "Vocabulário", hanzi: "词汇" },
  grammar: { label: "Gramática", hanzi: "语法" },
} as const;

export function CrossLinks({ blockId, current }: Props) {
  const id = String(blockId);
  const items = [
    { href: `/review/${id}`, key: "review" as const },
    { href: `/vocabulary/${id}`, key: "vocabulary" as const },
    { href: `/grammar/${id}`, key: "grammar" as const },
  ].filter((x) => x.key !== current);

  return (
    <aside
      className="mt-10 flex flex-wrap items-center gap-2 border-t pt-8"
      style={{ borderColor: "var(--border)" }}
      aria-label="Outras perspectivas deste bloco"
    >
      <span
        className="mr-1 text-xs text-ink/35"
        style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
      >
        Este bloco em:
      </span>
      {items.map((item) => {
        const cfg = modeConfig[item.key];
        return (
          <Link
            key={item.key}
            href={item.href}
            className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors hover:bg-ink/5"
            style={{
              borderColor: "var(--border)",
              fontFamily: "ui-sans-serif, system-ui, sans-serif",
              color: "rgba(28,25,23,0.6)",
            }}
          >
            <span className="font-hanzi text-sm">{cfg.hanzi}</span>
            {cfg.label}
          </Link>
        );
      })}
    </aside>
  );
}
