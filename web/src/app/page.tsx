import Link from "next/link";
import { blocks } from "@/lib/blocks";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-12">
      <div className="max-w-2xl">
        <p className="font-display text-4xl font-medium leading-tight tracking-tight text-ink md:text-5xl">
          Três entradas para o mesmo percurso.
        </p>
        <p className="mt-6 text-lg leading-relaxed text-ink/70">
          Revisão para leitura com pinyin na fonte; Vocabulário com tabelas completas;
          Gramática com estruturas, observações e contrastes. Cada bloco liga os três
          modos entre si.
        </p>
      </div>

      <ul className="mt-16 grid gap-6 sm:grid-cols-3">
        <li>
          <Link
            href="/review"
            className="block border border-ink/15 bg-paper p-6 transition hover:border-accent/40 hover:shadow-sm"
          >
            <span className="text-xs font-medium uppercase tracking-widest text-ink/45">
              01
            </span>
            <span className="mt-2 block font-display text-xl text-ink">Revisão</span>
            <span className="mt-2 block text-sm text-ink/60">
              Frases e padrões, leitura primeiro.
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/vocabulary"
            className="block border border-ink/15 bg-paper p-6 transition hover:border-accent/40 hover:shadow-sm"
          >
            <span className="text-xs font-medium uppercase tracking-widest text-ink/45">
              02
            </span>
            <span className="mt-2 block font-display text-xl text-ink">Vocabulário</span>
            <span className="mt-2 block text-sm text-ink/60">
              Hanzi, pinyin e tradução por bloco.
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/grammar"
            className="block border border-ink/15 bg-paper p-6 transition hover:border-accent/40 hover:shadow-sm"
          >
            <span className="text-xs font-medium uppercase tracking-widest text-ink/45">
              03
            </span>
            <span className="mt-2 block font-display text-xl text-ink">Gramática</span>
            <span className="mt-2 block text-sm text-ink/60">
              Estruturas, notas e diferenças.
            </span>
          </Link>
        </li>
      </ul>

      <section className="mt-20 border-t border-ink/15 pt-12">
        <h2 className="font-display text-lg text-ink">Blocos</h2>
        <ol className="mt-6 grid list-decimal gap-x-10 gap-y-2 pl-5 marker:text-ink/35 sm:grid-cols-2">
          {blocks.map((b) => (
            <li key={b.id} className="pl-2">
              <span className="text-ink/85">{b.title}</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
