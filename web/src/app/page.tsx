import Link from "next/link";
import { blocks } from "@/lib/blocks";

const modes = [
  {
    href: "/review",
    label: "Revisão",
    hanzi: "复习",
    description: "Frases e padrões com pinyin integrado. Leia primeiro, decore depois.",
    color: "var(--accent)",
  },
  {
    href: "/vocabulary",
    label: "Vocabulário",
    hanzi: "词汇",
    description: "Tabelas completas por bloco — Hanzi, pinyin e tradução lado a lado.",
    color: "var(--accent-warm)",
  },
  {
    href: "/grammar",
    label: "Gramática",
    hanzi: "语法",
    description: "Estruturas, observações e contrastes organizados por tema.",
    color: "#3d6b4a",
  },
] as const;

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-24">

      {/* Hero */}
      <section className="py-16 sm:py-20">
        <p
          className="text-xs font-medium uppercase tracking-widest mb-4"
          style={{ color: "var(--accent)", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
        >
          Chinês básico
        </p>
        <h1 className="font-display text-4xl font-medium leading-tight tracking-tight text-ink sm:text-5xl">
          15 blocos de conteúdo.<br />
          <span className="text-ink/40">Três formas de estudar.</span>
        </h1>
        <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink/60">
          Revisão, vocabulário e gramática interligados — cada bloco abre nas três perspectivas.
        </p>
      </section>

      {/* Mode cards */}
      <section>
        <div className="grid gap-4 sm:grid-cols-3">
          {modes.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="group relative overflow-hidden rounded-2xl border p-6 transition-shadow hover:shadow-md"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--paper)" }}
            >
              <div
                className="mb-4 inline-flex items-center justify-center rounded-xl px-3 py-1.5"
                style={{ backgroundColor: m.color + "15" }}
              >
                <span
                  className="font-hanzi text-lg font-bold"
                  style={{ color: m.color }}
                >
                  {m.hanzi}
                </span>
              </div>
              <h2
                className="font-display text-xl font-medium text-ink"
                style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: "1rem", fontWeight: 600 }}
              >
                {m.label}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/55">
                {m.description}
              </p>
              <span
                className="mt-4 inline-block text-xs font-medium transition-colors group-hover:opacity-100"
                style={{ color: m.color, fontFamily: "ui-sans-serif, system-ui, sans-serif", opacity: 0.7 }}
              >
                Abrir →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Block list */}
      <section className="mt-16 border-t pt-12" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-baseline justify-between mb-6">
          <h2
            className="text-sm font-semibold uppercase tracking-widest text-ink/40"
            style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
          >
            Blocos
          </h2>
          <span
            className="text-xs text-ink/35"
            style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
          >
            {blocks.length} blocos
          </span>
        </div>
        <ol className="grid gap-2 sm:grid-cols-2">
          {blocks.map((b) => (
            <li key={b.id}>
              <Link
                href={`/review/${b.id}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-ink/5 group"
              >
                <span
                  className="w-7 shrink-0 text-right text-xs tabular-nums text-ink/30"
                  style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
                >
                  {String(b.id).padStart(2, "0")}
                </span>
                <span className="text-sm text-ink/80 group-hover:text-ink transition-colors">
                  {b.title}
                </span>
                {b.vocabulary.length > 0 && (
                  <span
                    className="ml-auto shrink-0 text-xs text-ink/25"
                    style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
                  >
                    {b.vocabulary.length} palavras
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
