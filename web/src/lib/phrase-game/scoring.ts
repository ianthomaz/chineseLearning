/**
 * Planned scoring rules — documented in docs/phrase-game-scoring.md.
 *
 * NOTE: There is NO scoring UI in the MVP. This module computes the planned score
 * so the rules are encoded and testable for a later phase; nothing renders it yet.
 */

/**
 * In-phrase help actions, ordered by increasing cost. The numbering matches the
 * spec's help list (1 = remove extras … 4 = next piece).
 */
export type HelpAction =
  | "removeExtras"
  | "showFullPrompt"
  | "showPinyin"
  | "showTranslation"
  | "nextPiece";

export const HELP_LEVEL: Record<HelpAction, number> = {
  removeExtras: 1,
  showFullPrompt: 2,
  showPinyin: 2,
  showTranslation: 3,
  nextPiece: 4,
};

/** Score for each highest-help-level used (index 0 = no help). */
const SCORE_BY_HELP_LEVEL = [1.0, 1.0, 0.75, 0.5, 0.25] as const;

export type ScoreInput = {
  /** Did the (final) submit match the answer? */
  correct: boolean;
  /** Was there any wrong submit on this phrase? */
  wrongSubmit: boolean;
  /** Help actions used during the phrase. */
  helpUsed: HelpAction[];
  /** True if "next piece" was used to fill every slot (counts as failed attempt). */
  nextPieceFilledAll: boolean;
};

/**
 * Compute the planned score in [0, 1] for a single phrase.
 * Highest help level used wins; wrong submit or fully auto-filled = 0.
 */
export function computeScore(input: ScoreInput): number {
  if (!input.correct || input.wrongSubmit || input.nextPieceFilledAll) return 0;
  const highest = input.helpUsed.reduce(
    (max, action) => Math.max(max, HELP_LEVEL[action]),
    0,
  );
  return SCORE_BY_HELP_LEVEL[highest] ?? 0;
}
