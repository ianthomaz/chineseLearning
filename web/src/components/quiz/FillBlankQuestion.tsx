"use client";

import type { QuizQuestion } from "@/lib/gamification";
import type { AppLocale } from "@/lib/i18n-core";

interface FillBlankQuestionProps {
  question: QuizQuestion;
  userAnswer: string | number | string[] | null;
  setUserAnswer: (answer: string | number | string[] | null) => void;
  locale: AppLocale;
}

export function FillBlankQuestion({
  userAnswer,
  setUserAnswer,
}: FillBlankQuestionProps) {
  return (
    <input
      type="text"
      value={String(userAnswer || "")}
      onChange={(e) => setUserAnswer(e.target.value)}
      placeholder="Type your answer..."
      className="w-full rounded-lg border px-4 py-3 text-base outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
      style={{ borderColor: "var(--border)" }}
      autoFocus
    />
  );
}
