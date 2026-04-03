import type { Metadata } from "next";
import { BlockIndex } from "@/components/BlockIndex";
import { blocks } from "@/lib/blocks";

export const metadata: Metadata = {
  title: "Gramática",
};

export default function GrammarIndexPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-10">
      <h1 className="font-display text-3xl text-ink md:text-4xl">Gramática</h1>
      <p className="mt-4 max-w-2xl text-ink/65">
        Estruturas de exemplo, observações e contrastes extraídos do consolidado. O
        vocabulário isolado está no modo Vocabulário.
      </p>
      <BlockIndex blocks={blocks} mode="grammar" />
    </main>
  );
}
