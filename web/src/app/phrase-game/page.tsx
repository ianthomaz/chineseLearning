import { LoginGate } from "@/components/AuthGate";
import { PhraseGame } from "@/components/phrase-game/PhraseGame";

export default function PhraseGamePage() {
  return (
    <LoginGate>
      <PhraseGame />
    </LoginGate>
  );
}
