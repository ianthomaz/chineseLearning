import Link from "next/link";

type Props = {
  blockId: number;
  current: "review" | "vocabulary" | "grammar";
};

export function CrossLinks({ blockId, current }: Props) {
  const id = String(blockId);
  const items = [
    { href: `/review/${id}`, label: "Revisão deste bloco", key: "review" as const },
    {
      href: `/vocabulary/${id}`,
      label: "Vocabulário deste bloco",
      key: "vocabulary" as const,
    },
    { href: `/grammar/${id}`, label: "Gramática deste bloco", key: "grammar" as const },
  ].filter((x) => x.key !== current);

  return (
    <aside
      className="mt-14 border-t border-ink/15 pt-8"
      aria-label="Navegação entre áreas do mesmo bloco"
    >
      <p className="mb-3 text-xs font-medium uppercase tracking-widest text-ink/45">
        Ir para
      </p>
      <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              className="text-sm text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
