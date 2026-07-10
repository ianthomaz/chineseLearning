import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockStudyPage } from "@/components/BlockStudyPage";
import { getBlock, getBlockIds, getBlockSummaries } from "@/lib/blocks";



export function generateStaticParams() {
  if (process.env.NEXT_STATIC_EXPORT !== "1") return [];
  return getBlockIds().map((id) => ({ id }));
}

type Props = { params: Promise<{ id: string }> };


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
    <BlockStudyPage
      mode="vocabulary"
      block={block}
      blockSummaries={getBlockSummaries()}
    />
  );
}
