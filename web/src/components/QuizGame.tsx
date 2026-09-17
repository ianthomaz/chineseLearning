"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { ChineseWithPinyinLine } from "@/components/ChineseWithPinyinLine";
import { SpeakButton } from "@/components/ui/SpeakButton";
import { useLocale } from "@/context/LocaleContext";
import { trackEvent } from "@/lib/analytics";
import {
  countForTier,
  localizedQuestionPrompt,
  localizedExplanation,
  localizedCorrectAnswer,
  localizedCorrectOrder,
  localizedOptions,
  pickQuizSession,
  questionTypeDisplayName,
  type QuizTier,
} from "@/lib/gamification";
import type { QuizBank, QuizQuestion } from "@/lib/gamification";
import { PHRASE_POOLS } from "@/lib/phrase-game/types";
import type { AppLocale } from "@/lib/i18n-core";
import { recordFinishedRound, usePlayerProgress } from "@/lib/game-progress";
import { PlayerProgressCard } from "@/components/PlayerProgressCard";
import { MultipleChoiceQuestion } from "./quiz/MultipleChoiceQuestion";
import { FillBlankQuestion } from "./quiz/FillBlankQuestion";
import { TranslationQuestion } from "./quiz/TranslationQuestion";
import { OrderingQuestion } from "./quiz/OrderingQuestion";

type Phase = "setup" | "playing" | "finished";
type AnswerState = "answering" | "validating" | "result";

/** Questions per run — sampled randomly from the tier-filtered bank. */
const SESSION_SIZE = 20;

function correctAnswerLabel(q: QuizQuestion, locale: AppLocale): string {
  if (q.type === "multiple_choice" && typeof q.correct === "number") {
    const opts = localizedOptions(q, locale);
    return opts[q.correct] ?? "";
  }
  if (q.type === "fill_blank" || q.type === "translation") {
    return localizedCorrectAnswer(q, locale);
  }
  if (q.type === "ordering") {
    return localizedCorrectOrder(q, locale).join(" ");
  }
  return "";
}

export function QuizGame({ quizBank }: { quizBank: QuizBank }) {
  const { locale, t } = useLocale();
  const { question_types: questionTypes, questions: bankQuestions } = quizBank;

  const [phase, setPhase] = useState<Phase>("setup");
  const [tier, setTier] = useState<QuizTier>("hsk1");
  const [sessionQuestions, setSessionQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>("answering");
  const [userAnswer, setUserAnswer] = useState<string | number | string[] | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  /** Per-question outcome, so a finished quiz can be persisted item by item. */
  const results = useRef<Array<{ itemId: string; correct: boolean }>>([]);
  const quizStarted = useRef(false);
  const progress = usePlayerProgress();

  const tierCount = useMemo(
    () => countForTier(bankQuestions, tier),
    [bankQuestions, tier],
  );

  const currentQuestion = useMemo(
    () => sessionQuestions[currentIndex],
    [sessionQuestions, currentIndex],
  );

  const startSession = useCallback(() => {
    const nextSession = pickQuizSession(bankQuestions, tier, SESSION_SIZE);
    if (nextSession.length === 0) return false;
    setSessionQuestions(nextSession);
    setCurrentIndex(0);
    setScore(0);
    results.current = [];
    setUserAnswer(null);
    setIsCorrect(null);
    setAnswerState("answering");
    setPhase("playing");
    quizStarted.current = true;
    trackEvent({
      action: "quiz_start",
      category: "quiz",
      label: `${tier}/${nextSession.length}`,
      total: nextSession.length,
      locale,
    });
    return true;
  }, [bankQuestions, tier, locale]);

  const handleSubmitAnswer = useCallback(async () => {
    if (userAnswer === null || !currentQuestion) return;

    setAnswerState("validating");

    await new Promise((resolve) => setTimeout(resolve, 600));

    let correct = false;

    if (currentQuestion.type === "multiple_choice") {
      correct = userAnswer === currentQuestion.correct;
    } else if (currentQuestion.type === "fill_blank" || currentQuestion.type === "translation") {
      const correctAnswer = localizedCorrectAnswer(currentQuestion, locale);
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
    trackEvent({
      action: "question_answered",
      category: "quiz",
      label: String(currentQuestion.id),
      question_type: currentQuestion.type,
      block_id: currentQuestion.block,
      correct,
      value: correct ? 1 : 0,
      locale,
    });
    results.current.push({ itemId: String(currentQuestion.id), correct });
    setAnswerState("result");
  }, [userAnswer, currentQuestion, locale]);

  const handleNextQuestion = useCallback(() => {
    if (currentIndex < sessionQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setUserAnswer(null);
      setIsCorrect(null);
      setAnswerState("answering");
    } else {
      trackEvent({
        action: "quiz_complete",
        category: "quiz",
        label: `${score}/${sessionQuestions.length}`,
        score,
        total: sessionQuestions.length,
        locale,
      });
      // Signed-in players only; a guest gets a 401 and nothing is stored.
      recordFinishedRound({
        game: "quiz",
        tier,
        items: results.current.map((r) => ({ ...r, score: r.correct ? 1 : 0 })),
      });
      progress.reload();
      setPhase("finished");
    }
    // `progress.reload` is stable for the life of the component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, sessionQuestions.length, score, locale, tier]);

  const handleRestart = useCallback(() => {
    startSession();
  }, [startSession]);

  const handleChangeTier = useCallback(() => {
    setPhase("setup");
    setSessionQuestions([]);
    quizStarted.current = false;
  }, []);

  if (bankQuestions.length === 0) {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-sm text-ink/55">{t("gamification.emptyBank")}</p>
      </main>
    );
  }

  if (phase === "setup") {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {t("gamification.title")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink/55">
            {t("gamification.intro", {
              session: String(Math.min(SESSION_SIZE, tierCount)),
              bank: String(tierCount),
            })}
          </p>
        </header>

        <label className="mb-6 block" style={{ fontFamily: "var(--font-sans)" }}>
          <span className="mb-1.5 block text-sm font-semibold text-ink">
            {t("phraseGame.tierLabel")}
          </span>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as QuizTier)}
            className="w-full rounded-xl border bg-transparent px-3 py-2.5 text-sm text-ink"
            style={{ borderColor: "var(--border)" }}
          >
            {PHRASE_POOLS.map((id) => (
              <option key={id} value={id}>
                {t(`phraseGame.tier.${id}`)}
              </option>
            ))}
          </select>
          <span className="mt-1.5 block text-xs text-ink/45">
            {t(`phraseGame.tierDesc.${tier}`)}
          </span>
        </label>

        {tierCount === 0 ? (
          <p className="mb-4 text-sm text-danger">{t("gamification.tierEmpty")}</p>
        ) : null}

        <div className="mb-5">
          <PlayerProgressCard
            game="quiz"
            summary={progress.data?.quiz ?? null}
            recentRounds={progress.data?.recentRounds}
            signedIn={progress.data !== null}
            loaded={progress.loaded}
          />
        </div>

        <button
          type="button"
          onClick={() => startSession()}
          disabled={tierCount === 0}
          className="w-full rounded-2xl px-6 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: "var(--accent)" }}
        >
          {t("gamification.start")}
        </button>
      </main>
    );
  }

  if (phase === "finished") {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="rounded-2xl border p-6 sm:p-8" style={{ borderColor: "var(--border)" }}>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {t("gamification.finished")}
          </h1>
          <p className="mt-2 text-sm text-ink/55">
            {t(`phraseGame.tier.${tier}`)} · {t("gamification.intro", {
              session: String(sessionQuestions.length),
              bank: String(tierCount),
            })}
          </p>
          <div className="mt-6 space-y-4">
            <div
              className="rounded-xl border p-4"
              style={{ borderColor: "var(--border)" }}
            >
              <p className="text-sm text-ink/75">{t("gamification.finalScore")}</p>
              <p className="mt-1 font-display text-3xl font-bold text-accent">
                {score} / {sessionQuestions.length}
              </p>
            </div>
            <p className="text-base text-ink/75">
              {Math.round((score / sessionQuestions.length) * 100)}%
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleRestart}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              {t("gamification.restart")}
            </button>
            <button
              type="button"
              onClick={handleChangeTier}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-ink/70 transition-colors hover:bg-ink/5"
              style={{ borderColor: "var(--border)" }}
            >
              {t("gamification.changeTier")}
            </button>
          </div>
        </div>
      </main>
    );
  }

  const answerLabel = currentQuestion ? correctAnswerLabel(currentQuestion, locale) : "";

  return (
    <main className="mx-auto max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {t("gamification.title")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/55">
          {t(`phraseGame.tier.${tier}`)} ·{" "}
          {t("gamification.progress", {
            current: currentIndex + 1,
            total: sessionQuestions.length,
          })}
        </p>
      </header>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-ink/75">
            {t("gamification.progress", {
              current: currentIndex + 1,
              total: sessionQuestions.length,
            })}
          </p>
          <p className="text-sm font-medium text-accent">{score} points</p>
        </div>
        <div className="h-2 w-full rounded-full bg-ink/10">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / sessionQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      {currentQuestion ? (
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
              {currentIndex + 1} / {sessionQuestions.length}
            </span>
          </div>

          {/* Hanzi & Pinyin */}
          {currentQuestion.hanzi.trim() ? (
            <div className="mt-6 flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <ChineseWithPinyinLine
                  hanzi={currentQuestion.hanzi}
                  pinyin={currentQuestion.pinyin}
                />
              </div>
              <SpeakButton
                text={currentQuestion.hanzi}
                label={t("phraseGame.speak")}
                onPlay={() =>
                  trackEvent({
                    action: "audio_play",
                    category: "quiz",
                    label: currentQuestion.hanzi,
                    hanzi: currentQuestion.hanzi,
                    question_type: currentQuestion.type,
                  })
                }
              />
            </div>
          ) : null}

          {/* Question */}
          <p className="mt-6 text-lg leading-relaxed text-ink">
            {localizedQuestionPrompt(currentQuestion, locale)}
          </p>

          {/* Question Component - renders based on type */}
          <div className="mt-8">
            {renderQuestionComponent(currentQuestion, userAnswer, setUserAnswer, locale)}
          </div>

          {/* Loading State */}
          {answerState === "validating" ? (
            <div className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-accent/5 px-4 py-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              <p className="text-sm font-medium text-accent">{t("gamification.validating")}</p>
            </div>
          ) : null}

          {/* Result */}
          {answerState === "result" && isCorrect !== null ? (
            <div className="mt-6 space-y-4">
              <div
                className={`rounded-lg px-4 py-3 ${
                  isCorrect ? "bg-success-bg text-success" : "bg-danger-bg text-danger"
                }`}
              >
                <p className="font-medium">
                  {isCorrect ? t("gamification.correct") : t("gamification.incorrect")}
                </p>
                {!isCorrect && answerLabel ? (
                  <p className="mt-1 text-sm opacity-90">
                    {t("gamification.correctAnswer", { answer: answerLabel })}
                  </p>
                ) : null}
              </div>

              {/* Explanation */}
              {localizedExplanation(currentQuestion, locale) ? (
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
              ) : null}
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="mt-8 flex gap-3">
            {answerState === "answering" ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={userAnswer === null}
                className="flex-1 rounded-lg bg-accent px-4 py-2 font-medium text-white transition-opacity disabled:opacity-50 hover:opacity-90"
              >
                {t("gamification.submit")}
              </button>
            ) : null}

            {answerState === "result" ? (
              <button
                onClick={handleNextQuestion}
                className="flex-1 rounded-lg bg-accent px-4 py-2 font-medium text-white transition-opacity hover:opacity-90"
              >
                {currentIndex === sessionQuestions.length - 1
                  ? t("gamification.finish")
                  : t("gamification.next")}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}

function renderQuestionComponent(
  question: QuizQuestion,
  userAnswer: string | number | string[] | null,
  setUserAnswer: (answer: string | number | string[] | null) => void,
  locale: AppLocale,
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
