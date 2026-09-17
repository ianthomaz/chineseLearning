/**
 * Per-phrase scoring — documented in docs/phrase-game-scoring.md.
 *
 * The rules are tuned for a learning game, not a leaderboard: getting a phrase
 * wrong still earns credit for the words placed correctly, fixing your own
 * mistake costs less than being told the answer, and listening to the sentence
 * is free. Only giving up scores nothing.
 */

/**
 * In-phrase help actions, ordered by increasing cost.
 *
 * `listen` and `removeExtras` are free: hearing the sentence is studying, and
 * removing distractors only undoes optional added difficulty.
 */
export type HelpAction =
  | "removeExtras"
  | "showFullPrompt"
  | "showPinyin"
  | "showTranslation"
  | "listen"
  | "nextPiece";

export const HELP_LEVEL: Record<HelpAction, number> = {
  removeExtras: 0,
  listen: 0,
  showFullPrompt: 1,
  showPinyin: 1,
  showTranslation: 2,
  nextPiece: 3,
};

/** Multiplier for the highest help level used (index 0 = no help worth charging). */
const HELP_MULTIPLIER = [1, 0.75, 0.5, 0.25] as const;

/** Kept after fixing your own wrong answer — a retry is worth more than a reveal. */
const SELF_CORRECTION = 0.7;

/** A wrong final answer can never earn more than this, however close it was. */
const PARTIAL_CAP = 0.4;

export type ScoreInput = {
  /** Did the final submit match the answer? */
  correct: boolean;
  /** Was there a wrong submit before the final one on this phrase? */
  wrongSubmit: boolean;
  /** Help actions used during the phrase. */
  helpUsed: HelpAction[];
  /** True if "next piece" was used to fill every slot — the phrase was given away. */
  nextPieceFilledAll: boolean;
  /**
   * Share of pieces sitting in their correct slot in the final answer, 0..1.
   * Only consulted when the answer is wrong. See {@link placementAccuracy}.
   */
  placement?: number;
};

/**
 * Share of the answer strip that is in the right place, in [0, 1].
 * The denominator is the correct answer's length, so missing or extra pieces
 * both cost.
 */
export function placementAccuracy(
  answer: ReadonlyArray<{ id: string }>,
  correctOrder: ReadonlyArray<{ id: string }>,
): number {
  if (correctOrder.length === 0) return 0;
  let hits = 0;
  for (let i = 0; i < correctOrder.length; i += 1) {
    if (answer[i]?.id === correctOrder[i].id) hits += 1;
  }
  return hits / correctOrder.length;
}

/** Compute the score in [0, 1] for a single phrase. */
export function computeScore(input: ScoreInput): number {
  // Auto-completing the whole sentence is giving up, whatever else happened.
  if (input.nextPieceFilledAll) return 0;

  const highest = input.helpUsed.reduce(
    (max, action) => Math.max(max, HELP_LEVEL[action]),
    0,
  );
  const helpMultiplier = HELP_MULTIPLIER[highest] ?? 0;

  const base = input.correct
    ? input.wrongSubmit
      ? SELF_CORRECTION
      : 1
    : Math.min(input.placement ?? 0, PARTIAL_CAP);

  // Two decimals: scores are summed over a round and shown to the player.
  return Math.round(base * helpMultiplier * 100) / 100;
}

/** Round total, in points, where each phrase is worth at most 1. */
export function roundScore(scores: readonly number[]): number {
  return Math.round(scores.reduce((sum, s) => sum + s, 0) * 100) / 100;
}
