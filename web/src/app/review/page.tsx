import type { Metadata } from "next";
import { StudyModeIndex } from "@/components/StudyModeIndex";
import { getBlocks } from "@/lib/blocks";


export const metadata: Metadata = {
  title: "Revisão",
};


export default function ReviewIndexPage() {
  return <StudyModeIndex mode="review" blocks={getBlocks()} />;
}
