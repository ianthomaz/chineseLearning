import { PHRASE_POOLS, type PhrasePool } from "@/lib/phrase-game/types";
import type { QuizQuestion } from "./types";

export type QuizTier = PhrasePool;

/** Cumulative pool filter — same bands as the phrase game. */
export function tierFilterQuestions(questions: QuizQuestion[], tier: QuizTier): QuizQuestion[] {
  const maxIdx = PHRASE_POOLS.indexOf(tier);
  if (maxIdx < 0) return questions;
  const allowed = new Set(PHRASE_POOLS.slice(0, maxIdx + 1));
  return questions.filter((q) => q.pool && allowed.has(q.pool));
}

function shuffleQuestions(items: QuizQuestion[]): QuizQuestion[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

/** Random session sample from the tier-filtered bank. */
export function pickQuizSession(
  questions: QuizQuestion[],
  tier: QuizTier,
  sessionSize: number,
): QuizQuestion[] {
  const filtered = tierFilterQuestions(questions, tier);
  return shuffleQuestions(filtered).slice(0, Math.min(sessionSize, filtered.length));
}

export function countForTier(questions: QuizQuestion[], tier: QuizTier): number {
  return tierFilterQuestions(questions, tier).length;
}
