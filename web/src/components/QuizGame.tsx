"use client";

import { useState, useCallback, useMemo } from "react";
import { ChineseWithPinyinLine } from "@/components/ChineseWithPinyinLine";
import { useLocale } from "@/context/LocaleContext";
import {
  localizedQuestionPrompt,
  localizedExplanation,
  localizedCorrectAnswer,
  localizedCorrectOrder,
  questionTypeDisplayName,
  quizBank,
} from "@/lib/gamification";
import type { QuizQuestion } from "@/lib/gamification";
import type { AppLocale } from "@/lib/i18n-core";
import { MultipleChoiceQuestion } from "./quiz/MultipleChoiceQuestion";
import { FillBlankQuestion } from "./quiz/FillBlankQuestion";
import { TranslationQuestion } from "./quiz/TranslationQuestion";
import { OrderingQuestion } from "./quiz/OrderingQuestion";

type QuizState = "idle" | "answering" | "validating" | "result";

export function QuizGame() {
  const { locale, t } = useLocale();
  const { question_types: questionTypes, questions } = quizBank;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [state, setState] = useState<QuizState>("answering");
  const [userAnswer, setUserAnswer] = useState<string | number | string[] | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const currentQuestion = useMemo(() => questions[currentIndex], [questions, currentIndex]);

  const handleSubmitAnswer = useCallback(async () => {
    if (userAnswer === null) return;

    setState("validating");

    // Simulate validation delay for UX
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Check answer based on question type
    let correct = false;

    if (currentQuestion.type === "multiple_choice") {
      correct = userAnswer === currentQuestion.correct;
    } else if (currentQuestion.type === "fill_blank" || currentQuestion.type === "translation") {
      const correctAnswer = localizedCorrectAnswer(currentQuestion, locale);
      // Normalize: trim and lowercase
      const normalized = String(userAnswer).trim().toLowerCase();
      const normalizedCorrect = correctAnswer.trim().toLowerCase();
      correct = normalized === normalizedCorrect;
    } else if (currentQuestion.type === "ordering") {
      const correctOrder = localizedCorrectOrder(currentQuestion, locale);
      correct = JSON.stringify(userAnswer) === JSON.stringify(correctOrder);
    }

    setIsCorrect(correct);
    if (correct) {
      setScore((prev) => prev + 1);
    }
    setState("result");
  }, [userAnswer, currentQuestion, locale]);

  const handleNextQuestion = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setUserAnswer(null);
      setIsCorrect(null);
      setState("answering");
    } else {
      // Quiz finished
      setState("idle");
    }
  }, [currentIndex, questions.length]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setScore(0);
    setUserAnswer(null);
    setIsCorrect(null);
    setState("answering");
  }, []);

  // Quiz finished screen
  if (state === "idle" && (currentIndex >= questions.length || isCorrect !== null)) {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="rounded-2xl border p-6 sm:p-8" style={{ borderColor: "var(--border)" }}>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {t("gamification.finished")}
          </h1>
          <div className="mt-6 space-y-4">
            <div
              className="rounded-xl border p-4"
              style={{ borderColor: "var(--border)" }}
            >
              <p className="text-sm text-ink/75">{t("gamification.finalScore")}</p>
              <p className="mt-1 font-display text-3xl font-bold text-accent">
                {score} / {questions.length}
              </p>
            </div>
            <p className="text-base text-ink/75">
              {Math.round((score / questions.length) * 100)}%
            </p>
          </div>
          <button
            onClick={handleRestart}
            className="mt-6 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            {t("gamification.restart")}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-ink/75">
            {t("gamification.progress", {
              current: currentIndex + 1,
              total: questions.length,
            })}
          </p>
          <p className="text-sm font-medium text-accent">{score} points</p>
        </div>
        <div className="h-2 w-full rounded-full bg-ink/10">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div
        className="rounded-2xl border p-6 sm:p-8"
        style={{ borderColor: "var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink/45">
              {questionTypeDisplayName(questionTypes[currentQuestion.type], locale)}
            </p>
            <p className="mt-1 text-xs text-ink/55">
              {t("gamification.blockLabel", { n: String(currentQuestion.block) })}
            </p>
          </div>
          <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>

        {/* Hanzi & Pinyin */}
        {currentQuestion.hanzi.trim() && (
          <div className="mt-6">
            <ChineseWithPinyinLine
              hanzi={currentQuestion.hanzi}
              pinyin={currentQuestion.pinyin}
            />
          </div>
        )}

        {/* Question */}
        <p className="mt-6 text-lg leading-relaxed text-ink">
          {localizedQuestionPrompt(currentQuestion, locale)}
        </p>

        {/* Question Component - renders based on type */}
        <div className="mt-8">
          {renderQuestionComponent(currentQuestion, userAnswer, setUserAnswer, locale)}
        </div>

        {/* Loading State */}
        {state === "validating" && (
          <div className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-accent/5 px-4 py-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="text-sm font-medium text-accent">{t("gamification.validating")}</p>
          </div>
        )}

        {/* Result */}
        {state === "result" && isCorrect !== null && (
          <div className="mt-6 space-y-4">
            <div
              className={`rounded-lg px-4 py-3 ${
                isCorrect ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
              }`}
            >
              <p className="font-medium">
                {isCorrect ? t("gamification.correct") : t("gamification.incorrect")}
              </p>
            </div>

            {/* Explanation */}
            {localizedExplanation(currentQuestion, locale) && (
              <div
                className="rounded-lg border p-4"
                style={{ borderColor: "var(--border)" }}
              >
                <p className="text-xs font-medium uppercase tracking-wide text-ink/45">
                  {t("gamification.explanation")}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink">
                  {localizedExplanation(currentQuestion, locale)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex gap-3">
          {state === "answering" && (
            <button
              onClick={handleSubmitAnswer}
              disabled={userAnswer === null}
              className="flex-1 rounded-lg bg-accent px-4 py-2 font-medium text-white transition-opacity disabled:opacity-50 hover:opacity-90"
            >
              {t("gamification.submit")}
            </button>
          )}

          {state === "result" && (
            <button
              onClick={handleNextQuestion}
              className="flex-1 rounded-lg bg-accent px-4 py-2 font-medium text-white transition-opacity hover:opacity-90"
            >
              {currentIndex === questions.length - 1
                ? t("gamification.finish")
                : t("gamification.next")}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

function renderQuestionComponent(
  question: QuizQuestion,
  userAnswer: string | number | string[] | null,
  setUserAnswer: (answer: string | number | string[] | null) => void,
  locale: AppLocale
) {
  const commonProps = {
    question,
    userAnswer,
    setUserAnswer,
    locale,
  };

  switch (question.type) {
    case "multiple_choice":
      return <MultipleChoiceQuestion {...commonProps} />;
    case "fill_blank":
      return <FillBlankQuestion {...commonProps} />;
    case "translation":
      return <TranslationQuestion {...commonProps} />;
    case "ordering":
      return <OrderingQuestion {...commonProps} />;
    default:
      return null;
  }
}
