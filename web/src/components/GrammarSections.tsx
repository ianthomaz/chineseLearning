type Props = {
  structures: string[];
  notes: string[];
  differences: string[];
  priorities: string[];
};

function ListSection({
  title,
  items,
  useRuby,
}: {
  title: string;
  items: string[];
  useRuby?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl text-ink">{title}</h2>
      <ul className="mt-4 space-y-4">
        {items.map((item, i) => (
          <li
            key={`${title}-${i}`}
            className={
              useRuby
                ? "font-ruby text-xl leading-relaxed text-ink md:text-2xl"
                : "text-ink/85"
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
  structures,
  notes,
  differences,
  priorities,
}: Props) {
  const hasAnything =
    structures.length +
      notes.length +
      differences.length +
      priorities.length >
    0;
  if (!hasAnything) {
    return (
      <p className="text-ink/55">
        Não há notas de gramática neste bloco no consolidado.
      </p>
    );
  }
  return (
    <>
      <ListSection title="Estruturas e exemplos" items={structures} useRuby />
      <ListSection title="Observações" items={notes} />
      <ListSection title="Diferenças e contrastes" items={differences} />
      <ListSection title="Prioridades" items={priorities} />
    </>
  );
}
