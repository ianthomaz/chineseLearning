import type { Metadata } from "next";
import { StudyModeIndex } from "@/components/StudyModeIndex";
import { getBlockIndexEntries } from "@/lib/blocks";


export const metadata: Metadata = {
  title: "Vocabulário",
};


export default function VocabularyIndexPage() {
  return <StudyModeIndex mode="vocabulary" blocks={getBlockIndexEntries()} />;
}
