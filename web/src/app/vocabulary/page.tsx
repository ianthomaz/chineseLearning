import type { Metadata } from "next";
import { StudyModeIndex } from "@/components/StudyModeIndex";
import { getBlocks } from "@/lib/blocks";


export const metadata: Metadata = {
  title: "Vocabulário",
};


export default function VocabularyIndexPage() {
  return <StudyModeIndex mode="vocabulary" blocks={getBlocks()} />;
}
