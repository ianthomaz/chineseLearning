import type { Metadata } from "next";
import { StudyModeIndex } from "@/components/StudyModeIndex";

export const metadata: Metadata = {
  title: "Gramática",
};

export default function GrammarIndexPage() {
  return <StudyModeIndex mode="grammar" />;
}
