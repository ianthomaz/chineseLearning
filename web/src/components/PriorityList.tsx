type Props = {
  items: string[];
  title?: string;
};

export function PriorityList({ items, title = "Prioridades" }: Props) {
  if (items.length === 0) return null;
  return (
    <section className="mt-12">
      <h2 className="font-display text-xl text-ink">{title}</h2>
      <ol className="mt-4 list-decimal space-y-2 pl-5 marker:text-ink/40">
        {items.map((item, i) => (
          <li key={`${i}-${item}`} className="pl-1 text-ink/85">
            {item}
          </li>
        ))}
      </ol>
    </section>
  );
}
