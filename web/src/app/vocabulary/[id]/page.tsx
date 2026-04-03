import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockPager } from "@/components/BlockPager";
import { CrossLinks } from "@/components/CrossLinks";
import { VocabTable } from "@/components/VocabTable";
import { getBlock, getBlockIds } from "@/lib/blocks";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return getBlockIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const block = getBlock(id);
  if (!block) return { title: "Bloco" };
  return { title: `Vocabulário · ${block.title}` };
}

export default async function VocabularyBlockPage({ params }: Props) {
  const { id } = await params;
  const block = getBlock(id);
  if (!block) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 pb-24 pt-10">
      {/* Header */}
      <div className="mb-10">
        <p
          className="mb-2 text-xs font-medium uppercase tracking-widest text-ink/35"
          style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
        >
          Bloco {String(block.id).padStart(2, "0")} · Vocabulário
        </p>
        <h1 className="font-display text-3xl font-medium text-ink md:text-4xl">
          {block.title}
        </h1>
        {block.vocabulary.length > 0 && (
          <p
            className="mt-2 text-sm text-ink/40"
            style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
          >
            {block.vocabulary.length} {block.vocabulary.length === 1 ? "palavra" : "palavras"}
          </p>
        )}
      </div>

      {/* Table */}
      {block.vocabulary.length > 0 ? (
        <VocabTable rows={block.vocabulary} />
      ) : (
        <p className="text-sm text-ink/50">Sem tabela de vocabulário neste bloco.</p>
      )}

      <CrossLinks blockId={block.id} current="vocabulary" />
      <BlockPager blockId={block.id} mode="vocabulary" />
    </main>
  );
}
