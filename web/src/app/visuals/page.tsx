import type { Metadata } from "next";
import { VisualsView } from "@/components/VisualsView";
import { getVisualPdfCatalog } from "@/lib/vocabulary-pdf-downloads.server";


export const metadata: Metadata = {
  title: "Visuais",
};


export default function VisualsPage() {
  return <VisualsView catalog={getVisualPdfCatalog()} />;
}
