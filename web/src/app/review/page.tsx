import type { Metadata } from "next";
import { StudyModeIndex } from "@/components/StudyModeIndex";

export const metadata: Metadata = {
  title: "Revisão",
};

export default function ReviewIndexPage() {
  return <StudyModeIndex mode="review" />;
}
