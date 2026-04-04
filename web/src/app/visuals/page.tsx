import type { Metadata } from "next";
import { VisualsView } from "@/components/VisualsView";

export const metadata: Metadata = {
  title: "Visuais",
};

export default function VisualsPage() {
  return <VisualsView />;
}
