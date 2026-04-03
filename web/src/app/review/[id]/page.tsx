import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockPager } from "@/components/BlockPager";
import { CrossLinks } from "@/components/CrossLinks";
import { PriorityList } from "@/components/PriorityList";
import { ReviewStructures } from "@/components/ReviewStructures";
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
  return { title: `Revisão · ${block.title}` };
}

export default async function ReviewBlockPage({ params }: Props) {
  const { id } = await params;
  const block = getBlock(id);
  if (!block) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 pb-24 pt-10">
      {/* Header */}
      <div className="mb-12">
        <p
          className="mb-2 text-xs font-medium uppercase tracking-widest text-ink/35"
          style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
        >
          Bloco {String(block.id).padStart(2, "0")} · Revisão
        </p>
        <h1 className="font-display text-3xl font-medium text-ink md:text-4xl">
          {block.title}
        </h1>
      </div>

      {/* Structures */}
      <ReviewStructures blockId={block.id} lines={block.structures} />

      {/* Priorities (block 15) */}
      <PriorityList
        items={block.priorities}
        blockId={block.id}
        studyMode="review"
      />

      {/* Vocabulary meta (block 15 only) */}
      {block.id === 15 && block.vocabulary.length > 0 ? (
        <section className="mt-14">
          <h2
            className="mb-1 text-xs font-semibold uppercase tracking-widest text-ink/40"
            style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
          >
            Vocabulário de estudo
          </h2>
          <p className="mb-5 text-sm text-ink/50">
            Tabela completa também em Vocabulário.
          </p>
          <VocabTable rows={block.vocabulary} />
        </section>
      ) : null}

      <CrossLinks blockId={block.id} current="review" />
      <BlockPager blockId={block.id} mode="review" />
    </main>
  );
}
