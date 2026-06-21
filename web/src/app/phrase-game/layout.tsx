import type { Metadata } from "next";
import { PhraseGameSession } from "@/components/phrase-game/PhraseGameSession";

export const metadata: Metadata = { title: "Quebra-Cabeça de Frases" };

const MATERIAL_SYMBOLS =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap";

export default function PhraseGameLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href={MATERIAL_SYMBOLS} />
      <PhraseGameSession>{children}</PhraseGameSession>
    </>
  );
}
