import type { Metadata } from "next";
import { BlockIndex } from "@/components/BlockIndex";
import { blocks } from "@/lib/blocks";

export const metadata: Metadata = {
  title: "Vocabulário",
};

export default function VocabularyIndexPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-24 pt-10">
      <p
        className="mb-2 text-xs font-medium uppercase tracking-widest text-ink/35"
        style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
      >
        词汇
      </p>
      <h1 className="font-display text-3xl font-medium text-ink md:text-4xl">Vocabulário</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink/55">
        Tabelas hanzi · pinyin · português organizadas por bloco. Consulte Gramática para
        estruturas e regras de uso.
      </p>
      <BlockIndex blocks={blocks} mode="vocabulary" />
    </main>
  );
}
