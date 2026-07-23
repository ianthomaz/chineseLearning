import type { Metadata } from "next";
import { LoginGate } from "@/components/AuthGate";
import { RandomHanziClient } from "@/components/RandomHanziClient";
import { loadPracticeLibrary } from "@/server/db/practice-library";

export const metadata: Metadata = {
  title: "Praticar",
  description:
    "Chat, hanzi aleatório ou hanzi em contexto — escolhe o tipo de treino.",
};

export default async function PraticarPage() {
  const library = await loadPracticeLibrary();

  return (
    <LoginGate>
      <RandomHanziClient
        lexicoCategories={library.categories}
        contextDecks={library.contextDecks}
        contextDeckMeta={library.contextDeckMeta}
      />
    </LoginGate>
  );
}
