type Props = {
  items: string[];
  title?: string;
};

export function PriorityList({ items, title = "Prioridades" }: Props) {
  if (items.length === 0) return null;
  return (
    <section className="mt-10">
      <h2
        className="mb-4 text-xs font-semibold uppercase tracking-widest text-ink/40"
        style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
      >
        {title}
      </h2>
      <ol className="space-y-2">
        {items.map((item, i) => (
          <li key={`${i}-${item}`} className="flex items-baseline gap-3">
            <span
              className="w-5 shrink-0 text-right text-xs tabular-nums text-ink/30"
              style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
            >
              {i + 1}
            </span>
            <span className="text-sm text-ink/80">{item}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
