import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlockPager } from "@/components/BlockPager";
import { CrossLinks } from "@/components/CrossLinks";
import { GrammarSections } from "@/components/GrammarSections";
import { getBlock, getBlockIds } from "@/lib/blocks";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return getBlockIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const block = getBlock(id);
  if (!block) return { title: "Bloco" };
  return { title: `Gramática · ${block.title}` };
}

export default async function GrammarBlockPage({ params }: Props) {
  const { id } = await params;
  const block = getBlock(id);
  if (!block) notFound();

  return (
    <main className="mx-auto max-w-3xl px-5 pb-24 pt-10">
      <p className="text-xs font-medium uppercase tracking-widest text-ink/45">
        Bloco {block.id}
      </p>
      <h1 className="mt-2 font-display text-3xl text-ink md:text-4xl">{block.title}</h1>
      <p className="mt-4 text-sm text-ink/55">
        Vocabulário deste bloco:{" "}
        <Link
          href={`/vocabulary/${block.id}`}
          className="text-accent underline decoration-accent/30"
        >
          abrir tabela
        </Link>
        .
      </p>

      <div className="mt-10">
        <GrammarSections
          structures={block.structures}
          notes={block.notes}
          differences={block.differences}
          priorities={block.priorities}
        />
      </div>

      <CrossLinks blockId={block.id} current="grammar" />
      <BlockPager blockId={block.id} mode="grammar" />
    </main>
  );
}
