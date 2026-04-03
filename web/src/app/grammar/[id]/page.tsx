import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockStudyPage } from "@/components/BlockStudyPage";
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

  return <BlockStudyPage mode="grammar" block={block} />;
}
