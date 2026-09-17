import type { PhrasePool, Tier } from "./types";

type AssignInput = {
  tier: Tier;
  nivel?: number;
  tokens: Array<{ dificil: boolean }>;
};

/** Classify a phrase into one of four HSK knowledge pools (build time). */
export function assignPhrasePool(input: AssignInput): PhrasePool {
  if (input.tier === "hsk1") return "hsk1";

  const tokenCount = input.tokens.length;
  const hardCount = input.tokens.filter((t) => t.dificil).length;
  const nivel = input.nivel ?? 1;

  if (nivel >= 3 && tokenCount >= 5) return "hsk3";
  if (tokenCount >= 7) return "hsk3";
  if (hardCount >= 3 && tokenCount >= 4) return "hsk3";
  if (nivel >= 4) return "hsk3";

  if (nivel >= 2 && tokenCount >= 4) return "hsk2plus";
  if (hardCount >= 2) return "hsk2plus";
  if (tokenCount >= 6) return "hsk2plus";
  if (nivel >= 3) return "hsk2plus";

  if (hardCount >= 1) return "hsk2";
  if (nivel >= 2) return "hsk2";
  if (tokenCount >= 4) return "hsk2";

  return "hsk2";
}
