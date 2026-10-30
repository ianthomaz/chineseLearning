"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/context/LocaleContext";
import { trackEvent } from "@/lib/analytics";
import { deriveBoard } from "@/lib/phrase-game/pieces";
import { attemptString, validateAttempt } from "@/lib/phrase-game/validate";
import {
  isPinyinShowing,
  isTranslationShowing,
  localizedPrompt,
  type RevealState,
} from "@/lib/phrase-game/display";
import type { DisplaySettings, GameLevel, GameTier, Piece, RoundItem } from "@/lib/phrase-game/types";
import {
  computeScore,
  placementAccuracy,
  type HelpAction,
} from "@/lib/phrase-game/scoring";
import { logGameEvent } from "@/lib/phrase-game/game-log";
import { Board, type BoardValue } from "./Board";
import { ProgressDots } from "./ProgressDots";
import { SpeakButton } from "@/components/ui/SpeakButton";
import { HelpIconButton } from "./HelpIconButton";
import { MaterialIcon } from "./MaterialIcon";

/** Shared look for View + Listen in the prompt card (not the pill helps). */
const PROMPT_ACTION_CLASS =
  "inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl border-2 px-3.5 py-2 text-sm font-semibold transition-colors hover:opacity-90 active:scale-[0.98]";

const PROMPT_ACTION_STYLE = {
  borderColor: "var(--accent)",
  color: "var(--accent)",
  backgroundColor: "rgba(45,90,140,0.08)",
  fontFamily: "var(--font-sans)",
} as const;

type Props = {
  item: RoundItem;
  tier: GameTier;
  roundId: string;
  level: GameLevel;
  settings: DisplaySettings;
  index: number;
  total: number;
  results: Array<"correct" | "wrong" | null>;
  /** Already scored this slot — open in review mode so the player can study again. */
  priorResult: "correct" | "wrong" | null;
  isLast: boolean;
  canPrev: boolean;
  canForward: boolean;
  onPrev: () => void;
  onForward: () => void;
  onSettingsChange: (settings: DisplaySettings) => void;
  onResult: (correct: boolean, score: number) => void;
  onNext: () => void;
};

const AUTO_ADVANCE_MS = 6000;

export function GameplayScreen({
  item,
  tier,
  roundId,
  level,
  settings,
  index,
  total,
  results,
  priorResult,
  isLast,
  canPrev,
  canForward,
  onPrev,
  onForward,
  onSettingsChange,
  onResult,
  onNext,
}: Props) {
  const { t, locale } = useLocale();
  const phrase = item.phrase;
  const isReview = priorResult !== null;

  // Derive the board exactly once per phrase (random shuffle/split must be stable).
  const derived = useMemo(
    () => deriveBoard(phrase, level, item.distractorCount),
    [phrase, level, item.distractorCount],
  );

  const [board, setBoard] = useState<BoardValue>(() =>
    isReview
      ? { bank: [], answer: derived.correctOrder }
      : { bank: derived.bank, answer: [] },
  );
  const [reveal, setReveal] = useState<RevealState>({
    pinyin: isReview,
    translation: isReview,
  });
  const [removedExtras, setRemovedExtras] = useState(false);
  const [submitted, setSubmitted] = useState<boolean | null>(
    isReview ? priorResult === "correct" : null,
  );
  /** The phrase is settled: no more retries, the score has been reported. */
  const [finalized, setFinalized] = useState(isReview);
  const [wrongSubmit, setWrongSubmit] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [helpUsed] = useState<Set<HelpAction>>(() => new Set());

  /** One retry per phrase: fixing your own mistake should beat being told. */
  const canRetry = !isReview && submitted === false && !finalized;

  const hasExtras = useMemo(
    () => [...board.bank, ...board.answer].some((p) => p.isDistractor),
    [board],
  );

  // Auto-advance only after a fresh correct answer — never while reviewing.
  useEffect(() => {
    if (isReview || submitted !== true || !finalized) return;
    const id = window.setTimeout(onNext, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(id);
  }, [isReview, submitted, finalized, onNext]);

  function logHelp(action: HelpAction) {
    helpUsed.add(action);
    trackEvent({ action: "help_used", category: "phrase_game", label: action });
    logGameEvent("help_used", { roundId, tier, level, phraseId: phrase.id, detail: action });
  }

  function handleSubmit() {
    const result = validateAttempt(board.answer, phrase);
    // A first wrong answer offers a retry; the phrase only settles after that.
    const isFinal = result.correct || wrongSubmit;

    setSubmitted(result.correct);
    setReveal((r) => ({
      ...r,
      pinyin: true,
      suppressPinyin: false,
      translation: result.correct ? true : r.translation,
      suppressTranslation: result.correct ? false : r.suppressTranslation,
    }));

    trackEvent({ action: "phrase_submit", category: "phrase_game", label: phrase.id });
    trackEvent({
      action: result.correct ? "phrase_correct" : "phrase_wrong",
      category: "phrase_game",
      label: phrase.id,
    });

    if (!isFinal) {
      logGameEvent("phrase_result", {
        roundId,
        tier,
        level,
        phraseId: phrase.id,
        correct: false,
        attempt: result.attempt,
        detail: "retry",
      });
      return;
    }

    finalize(result.correct, result.attempt);
  }

  /** Settle the phrase: score it once, log it once, report it once. */
  function finalize(correct: boolean, attempt: string) {
    if (isReview) return;
    const score = computeScore({
      correct,
      wrongSubmit,
      helpUsed: [...helpUsed],
      nextPieceFilledAll: gaveUp,
      placement: placementAccuracy(board.answer, derived.correctOrder),
    });

    setFinalized(true);
    logGameEvent("phrase_result", {
      roundId,
      tier,
      level,
      phraseId: phrase.id,
      correct,
      attempt,
      detail: `score:${score}`,
    });
    onResult(correct, score);
  }

  /** Reopen the board after a first wrong answer. */
  function handleRetry() {
    setWrongSubmit(true);
    setSubmitted(null);
  }

  function handleRemoveExtras() {
    setBoard((b) => ({
      bank: b.bank.filter((p) => !p.isDistractor),
      answer: b.answer.filter((p) => !p.isDistractor),
    }));
    setRemovedExtras(true);
    logHelp("removeExtras");
  }

  function handleNextPiece() {
    const all: Piece[] = [...board.bank, ...board.answer];
    const order = derived.correctOrder;
    // Length of the already-correct leading prefix in the answer strip.
    let k = 0;
    while (k < board.answer.length && k < order.length && board.answer[k].id === order[k].id) {
      k += 1;
    }
    if (k >= order.length) return;
    const newAnswer = order.slice(0, k + 1);
    const answerIds = new Set(newAnswer.map((p) => p.id));
    const newBank = all.filter((p) => !answerIds.has(p.id));
    setBoard({ bank: newBank, answer: newAnswer });
    // Filling the last slot this way means the sentence was given away.
    if (newAnswer.length >= order.length) setGaveUp(true);
    logHelp("nextPiece");
  }

  const disabled = submitted !== null || isReview;
  // Review shows the solved board; colour it by the prior score, not as a live attempt.
  const answerState = isReview
    ? priorResult === "correct"
      ? "correct"
      : "wrong"
    : submitted === null
      ? "neutral"
      : submitted
        ? "correct"
        : "wrong";
  const canSubmit = !isReview && board.answer.length > 0 && submitted === null;
  const showPrompt = settings.showNativePrompt;
  const promptText = localizedPrompt(phrase, locale);
  const boardReveal =
    submitted !== null
      ? {
          pinyin: true,
          translation: submitted === true ? true : reveal.translation,
          suppressPinyin: false,
          suppressTranslation:
            submitted === true ? false : reveal.suppressTranslation,
        }
      : reveal;

  const pinyinShowing = isPinyinShowing(settings, boardReveal);
  const glossShowing = isTranslationShowing(settings, boardReveal);

  function toggleViewTranslation() {
    onSettingsChange({ ...settings, showNativePrompt: !settings.showNativePrompt });
  }

  /** Piece-level pinyin help: show ↔ hide (also overrides setup settings). */
  function togglePinyinHelp() {
    if (pinyinShowing) {
      setReveal((r) => ({ ...r, pinyin: false, suppressPinyin: true }));
      return;
    }
    setReveal((r) => ({ ...r, pinyin: true, suppressPinyin: false }));
    logHelp("showPinyin");
  }

  /** Piece-level gloss help: show ↔ hide. */
  function toggleTranslationHelp() {
    if (glossShowing) {
      setReveal((r) => ({ ...r, translation: false, suppressTranslation: true }));
      return;
    }
    setReveal((r) => ({ ...r, translation: true, suppressTranslation: false }));
    logHelp("showTranslation");
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <ProgressDots results={results} currentIndex={index} />
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={onPrev}
            disabled={!canPrev}
            aria-label={t("phraseGame.prevPhrase")}
            title={t("phraseGame.prevPhrase")}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-ink/55 transition-colors hover:bg-ink/5 hover:text-ink disabled:pointer-events-none disabled:opacity-25"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            ‹
          </button>
          <span
            className="min-w-[6.5rem] text-center text-xs text-ink/40"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {t("phraseGame.progress", { current: index + 1, total })}
          </span>
          <button
            type="button"
            onClick={onForward}
            disabled={!canForward}
            aria-label={t("phraseGame.nextPhrase")}
            title={t("phraseGame.nextPhrase")}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-ink/55 transition-colors hover:bg-ink/5 hover:text-ink disabled:pointer-events-none disabled:opacity-25"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            ›
          </button>
        </div>
      </div>

      <section
        className="space-y-3 rounded-2xl border px-4 py-3.5 sm:px-5"
        style={{ borderColor: "var(--border)" }}
        aria-label={t("phraseGame.promptLabel")}
      >
        <div className="min-w-0">
          <p
            className="mb-1 text-xs font-medium uppercase tracking-wide text-ink/40"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {t("phraseGame.promptLabel")}
          </p>
          {showPrompt ? (
            <p className="font-display text-xl leading-snug text-ink sm:text-2xl">{promptText}</p>
          ) : null}
        </div>

        {submitted === null ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={toggleViewTranslation}
              aria-pressed={showPrompt}
              aria-label={
                showPrompt
                  ? t("phraseGame.help.hideTranslation")
                  : t("phraseGame.help.viewTranslation")
              }
              title={
                showPrompt
                  ? t("phraseGame.help.hideTranslation")
                  : t("phraseGame.help.viewTranslation")
              }
              className={PROMPT_ACTION_CLASS}
              style={{
                ...PROMPT_ACTION_STYLE,
                opacity: showPrompt ? 1 : 0.72,
                backgroundColor: showPrompt
                  ? "rgba(45,90,140,0.08)"
                  : "transparent",
              }}
            >
              <MaterialIcon
                name={showPrompt ? "visibility_off" : "visibility"}
                className="text-xl"
                filled={!showPrompt}
              />
              <span className="hidden sm:inline">
                {showPrompt
                  ? t("phraseGame.help.hideTranslation")
                  : t("phraseGame.help.viewTranslation")}
              </span>
            </button>
            <SpeakButton
              text={phrase.hanzi}
              words={phrase.tokens.map((tok) => tok.palavra)}
              label={t("phraseGame.help.listen")}
              variant="active"
              onPlay={() => logHelp("listen")}
            />
          </div>
        ) : null}
      </section>

      <Board
        value={board}
        onChange={setBoard}
        settings={settings}
        reveal={boardReveal}
        disabled={disabled}
        answerState={answerState}
        labels={{
          bank: t("phraseGame.bankLabel"),
          answer: t("phraseGame.answerLabel"),
          answerEmpty: t("phraseGame.answerEmpty"),
          moveLeft: t("phraseGame.moveLeft"),
          moveRight: t("phraseGame.moveRight"),
        }}
      />

      {submitted === null ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40 sm:w-auto sm:min-w-[8rem]"
            style={{ backgroundColor: "var(--accent)" }}
          >
            {t("phraseGame.submit")}
          </button>
        </div>
      ) : null}

      {submitted === null ? (
        <div className="space-y-2">
          <p
            className="text-xs font-medium uppercase tracking-wide text-ink/40"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {t("phraseGame.extraOptions")}
          </p>
          <div className="flex flex-wrap gap-2">
            {hasExtras && !removedExtras ? (
              <HelpIconButton
                icon="delete_sweep"
                label={t("phraseGame.help.removeExtras")}
                onClick={handleRemoveExtras}
              />
            ) : null}
            <HelpIconButton
              icon={pinyinShowing ? "visibility_off" : "abc"}
              label={
                pinyinShowing
                  ? t("phraseGame.help.hidePinyin")
                  : t("phraseGame.help.showPinyin")
              }
              pressed={pinyinShowing}
              onClick={togglePinyinHelp}
            />
            <HelpIconButton
              icon={glossShowing ? "visibility_off" : "translate"}
              label={
                glossShowing
                  ? t("phraseGame.help.hideTranslation")
                  : t("phraseGame.help.showTranslation")
              }
              pressed={glossShowing}
              onClick={toggleTranslationHelp}
            />
            <HelpIconButton
              icon="extension"
              label={t("phraseGame.help.nextPiece")}
              onClick={handleNextPiece}
            />
          </div>
        </div>
      ) : null}

      {submitted !== null ? (
        <div
          className="rounded-2xl border p-4"
          style={{
            borderColor: submitted ? "var(--accent)" : "#b91c1c",
            backgroundColor: submitted ? "rgba(45,90,140,0.05)" : "rgba(185,28,28,0.04)",
          }}
        >
          <p className="font-medium" style={{ color: submitted ? "var(--accent)" : "#b91c1c" }}>
            {submitted ? t("phraseGame.correct") : t("phraseGame.wrong")}
          </p>
          {canRetry ? (
            <p className="mt-1 text-sm text-ink/70">{t("phraseGame.retryHint")}</p>
          ) : (
            <div className="mt-2 space-y-1 text-sm text-ink/70">
              <div className="flex flex-wrap items-center gap-2">
                {submitted ? (
                  <span className="font-hanzi text-lg text-ink">{phrase.hanzi}</span>
                ) : (
                  <span>
                    {t("phraseGame.correctAnswer")}{" "}
                    <span className="font-hanzi text-lg text-ink">{phrase.hanzi}</span>
                  </span>
                )}
                <SpeakButton
                  text={phrase.hanzi}
                  words={phrase.tokens.map((tok) => tok.palavra)}
                  label={t("phraseGame.speak")}
                />
              </div>
              {phrase.pinyin ? <p>{phrase.pinyin}</p> : null}
              <p>{promptText}</p>
            </div>
          )}
        </div>
      ) : null}

      {submitted !== null ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          {canRetry ? (
            <>
              <button
                type="button"
                onClick={() => finalize(false, attemptString(board.answer))}
                className="w-full rounded-xl border px-5 py-3.5 text-sm font-medium text-ink/70 hover:bg-ink/5 sm:w-auto"
                style={{ borderColor: "var(--border)" }}
              >
                {t("phraseGame.seeAnswer")}
              </button>
              <button
                type="button"
                onClick={handleRetry}
                className="w-full rounded-xl px-6 py-3.5 text-sm font-semibold text-white sm:w-auto sm:min-w-[8rem]"
                style={{ backgroundColor: "var(--accent)" }}
              >
                {t("phraseGame.retry")}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={isReview ? onForward : onNext}
              className="w-full rounded-xl px-6 py-3.5 text-sm font-semibold text-white sm:w-auto sm:min-w-[8rem]"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {isLast ? t("phraseGame.finish") : t("phraseGame.next")}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
