"use client";

import { useState, useEffect } from "react";
import type { QuizQuestion } from "@/lib/gamification";
import { localizedWords } from "@/lib/gamification";
import type { AppLocale } from "@/lib/i18n-core";

interface OrderingQuestionProps {
  question: QuizQuestion;
  userAnswer: string | number | string[] | null;
  setUserAnswer: (answer: string | number | string[] | null) => void;
  locale: AppLocale;
}

export function OrderingQuestion({
  question,
  userAnswer,
  setUserAnswer,
  locale,
}: OrderingQuestionProps) {
  const words = localizedWords(question, locale);
  const [ordered, setOrdered] = useState<string[]>([]);

  // Initialize ordered list
  useEffect(() => {
    if (!userAnswer) {
      setOrdered(Array.from(words).sort(() => Math.random() - 0.5));
    } else if (Array.isArray(userAnswer)) {
      setOrdered(userAnswer);
    }
  }, [userAnswer, words]);

  // Sync state with parent
  useEffect(() => {
    setUserAnswer(ordered);
  }, [ordered, setUserAnswer]);

  const handleMove = (from: number, to: number) => {
    const newOrdered = [...ordered];
    const [item] = newOrdered.splice(from, 1);
    newOrdered.splice(to, 0, item);
    setOrdered(newOrdered);
  };

  return (
    <div className="space-y-2">
      {ordered.map((word, index) => (
        <div
          key={index}
          className="flex items-center gap-2 rounded-lg border px-4 py-3"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="flex-shrink-0 text-xs font-bold text-ink/45">{index + 1}</span>
          <span className="flex-1 text-sm font-medium text-ink">{word}</span>
          <div className="flex gap-1">
            <button
              onClick={() => index > 0 && handleMove(index, index - 1)}
              disabled={index === 0}
              className="rounded px-2 py-1 text-xs font-medium text-ink/45 hover:bg-ink/5 disabled:opacity-30"
            >
              ↑
            </button>
            <button
              onClick={() => index < ordered.length - 1 && handleMove(index, index + 1)}
              disabled={index === ordered.length - 1}
              className="rounded px-2 py-1 text-xs font-medium text-ink/45 hover:bg-ink/5 disabled:opacity-30"
            >
              ↓
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
