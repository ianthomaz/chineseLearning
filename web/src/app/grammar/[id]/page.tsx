import type { Metadata } from "next";
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
    <main className="mx-auto max-w-3xl px-6 pb-24 pt-10">
      {/* Header */}
      <div className="mb-10">
        <p
          className="mb-2 text-xs font-medium uppercase tracking-widest text-ink/35"
          style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
        >
          Bloco {String(block.id).padStart(2, "0")} · Gramática
        </p>
        <h1 className="font-display text-3xl font-medium text-ink md:text-4xl">
          {block.title}
        </h1>
      </div>

      <GrammarSections
        structures={block.structures}
        notes={block.notes}
        differences={block.differences}
        priorities={block.priorities}
      />

      <CrossLinks blockId={block.id} current="grammar" />
      <BlockPager blockId={block.id} mode="grammar" />
    </main>
  );
}
