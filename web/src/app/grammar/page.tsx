import type { Metadata } from "next";
import { StudyModeIndex } from "@/components/StudyModeIndex";
import { getBlocks } from "@/lib/blocks";


export const metadata: Metadata = {
  title: "Gramática",
};


export default function GrammarIndexPage() {
  return <StudyModeIndex mode="grammar" blocks={getBlocks()} />;
}
