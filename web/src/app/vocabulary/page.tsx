import type { Metadata } from "next";
import { StudyModeIndex } from "@/components/StudyModeIndex";

export const metadata: Metadata = {
  title: "Vocabulário",
};

export default function VocabularyIndexPage() {
  return <StudyModeIndex mode="vocabulary" />;
}
