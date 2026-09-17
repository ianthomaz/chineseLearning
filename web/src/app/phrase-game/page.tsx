import { PhraseGame } from "@/components/phrase-game/PhraseGame";
import { getAllPhrases } from "@/lib/phrase-game/phrases";

export default function PhraseGamePage() {
  return <PhraseGame phrases={getAllPhrases()} />;
}
