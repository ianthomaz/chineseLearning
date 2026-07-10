import type { Metadata } from "next";
import { DialoguesIndexContent } from "@/components/DialoguesIndexContent";
import { getBlockSummaries } from "@/lib/blocks";
import { getGlobalDialogueSections } from "@/lib/global-dialogues.server";


export const metadata: Metadata = {
  title: "Diálogos",
};


export default function DialoguesPage() {
  return (
    <DialoguesIndexContent
      sections={getGlobalDialogueSections()}
      blocks={getBlockSummaries()}
    />
  );
}
