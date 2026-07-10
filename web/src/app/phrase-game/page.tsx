import { LoginGate } from "@/components/AuthGate";
import { PhraseGame } from "@/components/phrase-game/PhraseGame";
import { getAllPhrases } from "@/lib/phrase-game/phrases";



export default function PhraseGamePage() {
  return (
    <LoginGate>
      <PhraseGame phrases={getAllPhrases()} />
    </LoginGate>
  );
}
