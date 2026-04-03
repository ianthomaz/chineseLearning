import type { Metadata } from "next";
import { BlockIndex } from "@/components/BlockIndex";
import { blocks } from "@/lib/blocks";

export const metadata: Metadata = {
  title: "Vocabulário",
};

export default function VocabularyIndexPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-10">
      <h1 className="font-display text-3xl text-ink md:text-4xl">Vocabulário</h1>
      <p className="mt-4 max-w-2xl text-ink/65">
        Tabelas hanzi · pinyin · português por bloco. Para padrões de frase, use Revisão;
        para regras, Gramática.
      </p>
      <BlockIndex blocks={blocks} mode="vocabulary" />
    </main>
  );
}
