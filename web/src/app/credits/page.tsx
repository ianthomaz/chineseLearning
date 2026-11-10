import type { Metadata } from "next";
import { CreditsContent } from "@/components/legal/CreditsContent";

export const metadata: Metadata = {
  title: "Créditos e Licenças de Código Aberto · LearnChinese Today",
  description:
    "Créditos, licenças de código aberto e atribuições autorais do LearnChinese Today — Hanzi Writer, Make Me a Hanzi, Arphic, Noto Sans e curadoria sob CC BY-SA 4.0.",
  openGraph: {
    title: "Créditos e Licenças · LearnChinese Today",
    description:
      "Reconhecimento das comunidades de software livre e inventário de licenças abertas do LearnChinese Today.",
    url: "https://learnchinese.today/credits",
    siteName: "LearnChinese Today",
  },
};

export default function CreditsPage() {
  return <CreditsContent />;
}
