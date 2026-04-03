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
    <main className="mx-auto max-w-3xl px-5 pb-24 pt-10">
      <p className="text-xs font-medium uppercase tracking-widest text-ink/45">
        Bloco {block.id}
      </p>
      <h1 className="mt-2 font-display text-3xl text-ink md:text-4xl">{block.title}</h1>

      <div className="mt-12">
        <ReviewStructures blockId={block.id} lines={block.structures} />
        <PriorityList items={block.priorities} />
        {block.id === 15 && block.vocabulary.length > 0 ? (
          <section className="mt-14">
            <h2 className="font-display text-xl text-ink">Vocabulário meta</h2>
            <p className="mt-2 text-sm text-ink/55">
              Termos de estudo; tabela completa também em Vocabulário.
            </p>
            <div className="mt-6">
              <VocabTable rows={block.vocabulary} />
            </div>
          </section>
        ) : null}
      </div>

      <CrossLinks blockId={block.id} current="review" />
      <BlockPager blockId={block.id} mode="review" />
    </main>
  );
}
