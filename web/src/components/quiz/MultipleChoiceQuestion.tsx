"use client";

import { localizedOptions } from "@/lib/gamification";
import type { QuizQuestion } from "@/lib/gamification";
import type { AppLocale } from "@/lib/i18n-core";

interface MultipleChoiceQuestionProps {
  question: QuizQuestion;
  userAnswer: string | number | string[] | null;
  setUserAnswer: (answer: string | number | string[] | null) => void;
  locale: AppLocale;
}

export function MultipleChoiceQuestion({
  question,
  userAnswer,
  setUserAnswer,
  locale,
}: MultipleChoiceQuestionProps) {
  const options = localizedOptions(question, locale);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => setUserAnswer(index)}
          className={`rounded-lg border-2 px-4 py-3 text-left font-medium transition-colors ${
            userAnswer === index
              ? "border-accent bg-accent/10 text-accent"
              : "border-ink/10 text-ink hover:border-ink/30"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
