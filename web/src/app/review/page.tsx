import type { Metadata } from "next";
import { BlockIndex } from "@/components/BlockIndex";
import { blocks } from "@/lib/blocks";

export const metadata: Metadata = {
  title: "Revisão",
};

export default function ReviewIndexPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-10">
      <h1 className="font-display text-3xl text-ink md:text-4xl">Revisão</h1>
      <p className="mt-4 max-w-2xl text-ink/65">
        Padrões em chinês com pinyin pela fonte Hanzi Pinyin quando disponível. Traduções
        e lemas no modo Vocabulário; regras no modo Gramática.
      </p>
      <BlockIndex blocks={blocks} mode="review" />
    </main>
  );
}
