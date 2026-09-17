import type { Metadata } from "next";
import { LoginGate } from "@/components/AuthGate";
import { RandomHanziClient } from "@/components/RandomHanziClient";
import { getSessionUser } from "@/server/auth/session";
import {
  loadPracticeLibrary,
  type PracticeLibrary,
} from "@/server/db/practice-library";

export const metadata: Metadata = {
  title: "Praticar",
  description:
    "Chat, hanzi aleatório ou hanzi em contexto — escolhe o tipo de treino.",
};

/** `cookies()` is not available under `output: export`, which has no auth anyway. */
const STATIC_EXPORT = process.env.NEXT_STATIC_EXPORT === "1";

const EMPTY_LIBRARY: PracticeLibrary = {
  categories: [],
  contextDecks: [],
  contextDeckMeta: [],
};

/**
 * `LoginGate` hides the library from guests, but it is a Client Component: its
 * children are rendered on the server before it ever runs, so the whole practice
 * library (~180 kB of RSC payload) was shipped to visitors who only saw the
 * sign-in card. Reading the session first costs this route its static prerender,
 * which is the right trade for a page whose content depends on who is asking.
 */
export default async function PraticarPage() {
  const signedIn = !STATIC_EXPORT && (await getSessionUser()) !== null;
  const library = signedIn ? await loadPracticeLibrary() : EMPTY_LIBRARY;

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
