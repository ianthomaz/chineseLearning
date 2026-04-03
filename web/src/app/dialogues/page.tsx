import type { Metadata } from "next";
import { DialoguesIndexContent } from "@/components/DialoguesIndexContent";

export const metadata: Metadata = {
  title: "Diálogos",
};

export default function DialoguesPage() {
  return <DialoguesIndexContent />;
}
