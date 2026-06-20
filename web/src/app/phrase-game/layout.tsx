import type { Metadata } from "next";
import { PhraseGameSession } from "@/components/phrase-game/PhraseGameSession";

export const metadata: Metadata = { title: "Quebra-Cabeça de Frases" };

export default function PhraseGameLayout({ children }: { children: React.ReactNode }) {
  return <PhraseGameSession>{children}</PhraseGameSession>;
}
