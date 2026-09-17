import { PhraseGame } from "@/components/phrase-game/PhraseGame";
import { getRuntimePhrases } from "@/lib/phrase-game/phrases";

/**
 * In server mode the bank is fetched from `/api/phrase-game/bank` while the setup
 * screen is already interactive, so none of its ~530 kB lands in the first paint.
 * The static export has no route handlers, so there it still ships as props.
 */
const STATIC_EXPORT = process.env.NEXT_STATIC_EXPORT === "1";

export default function PhraseGamePage() {
  return <PhraseGame initialPhrases={STATIC_EXPORT ? getRuntimePhrases() : null} />;
}
