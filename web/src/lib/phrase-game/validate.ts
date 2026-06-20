/**
 * Answer validation: concatenate the hanzi of the pieces in the answer strip,
 * in order, with no spaces, and compare against the canonical answer (or any
 * accepted alternate).
 */

import type { Phrase, Piece, SubmitResult } from "./types";

export function attemptString(answer: Piece[]): string {
  return answer.map((p) => p.hanzi).join("");
}

export function validateAttempt(answer: Piece[], phrase: Phrase): SubmitResult {
  const attempt = attemptString(answer);
  const accepted = phrase.respostasAceitas ?? [];
  const correct = attempt === phrase.hanzi || accepted.includes(attempt);
  return { correct, attempt };
}
