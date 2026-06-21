"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/context/LocaleContext";
import { trackEvent } from "@/lib/analytics";
import { deriveBoard } from "@/lib/phrase-game/pieces";
import { validateAttempt } from "@/lib/phrase-game/validate";
import { localizedPrompt } from "@/lib/phrase-game/display";
import { nativePromptDisabled } from "@/lib/phrase-game/settings-by-level";
import type { DisplaySettings, GameLevel, GameTier, Piece, RoundItem } from "@/lib/phrase-game/types";
import type { HelpAction } from "@/lib/phrase-game/scoring";
import { logGameEvent } from "@/lib/phrase-game/game-log";
import { Board, type BoardValue } from "./Board";
import { ProgressDots } from "./ProgressDots";
import { SpeakButton } from "./SpeakButton";

type Props = {
  item: RoundItem;
  tier: GameTier;
  roundId: string;
  level: GameLevel;
  settings: DisplaySettings;
  index: number;
  total: number;
  results: Array<"correct" | "wrong" | null>;
  isLast: boolean;
  onSettingsChange: (settings: DisplaySettings) => void;
  onResult: (correct: boolean) => void;
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
  isLast,
  onSettingsChange,
  onResult,
  onNext,
}: Props) {
  const { t, locale } = useLocale();
  const phrase = item.phrase;

  // Derive the board exactly once per phrase (random shuffle/split must be stable).
  const derived = useMemo(
    () => deriveBoard(phrase, level, item.distractorCount),
    [phrase, level, item.distractorCount],
  );

  const [board, setBoard] = useState<BoardValue>({ bank: derived.bank, answer: [] });
  const [reveal, setReveal] = useState({ fullPrompt: false, pinyin: false, translation: false });
  const [removedExtras, setRemovedExtras] = useState(false);
  const [submitted, setSubmitted] = useState<boolean | null>(null);
  const [helpUsed] = useState<Set<HelpAction>>(() => new Set());

  const hasExtras = useMemo(
    () => [...board.bank, ...board.answer].some((p) => p.isDistractor),
    [board],
  );

  // Auto-advance only after a correct answer (wrong answers wait for the Next button).
  useEffect(() => {
    if (submitted !== true) return;
    const id = window.setTimeout(onNext, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(id);
  }, [submitted, onNext]);

  function logHelp(action: HelpAction) {
    helpUsed.add(action);
    trackEvent({ action: "help_used", category: "phrase_game", label: action });
    logGameEvent("help_used", { roundId, tier, level, phraseId: phrase.id, detail: action });
  }

  function handleSubmit() {
    const result = validateAttempt(board.answer, phrase);
    setSubmitted(result.correct);
    setReveal((r) => ({
      ...r,
      pinyin: true,
      translation: result.correct ? true : r.translation,
    }));
    trackEvent({ action: "phrase_submit", category: "phrase_game", label: phrase.id });
    trackEvent({
      action: result.correct ? "phrase_correct" : "phrase_wrong",
      category: "phrase_game",
      label: phrase.id,
    });
    logGameEvent("phrase_result", {
      roundId,
      tier,
      level,
      phraseId: phrase.id,
      correct: result.correct,
      attempt: result.attempt,
    });
    onResult(result.correct);
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
    logHelp("nextPiece");
  }

  const disabled = submitted !== null;
  const answerState = submitted === null ? "neutral" : submitted ? "correct" : "wrong";
  const canSubmit = board.answer.length > 0 && submitted === null;
  const showPrompt = settings.showNativePrompt || reveal.fullPrompt;
  const promptText = localizedPrompt(phrase, locale);
  const boardReveal =
    submitted !== null
      ? { pinyin: true, translation: submitted === true ? true : reveal.translation }
      : { pinyin: reveal.pinyin, translation: reveal.translation };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <ProgressDots results={results} currentIndex={index} />
        <span className="text-xs text-ink/40" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
          {t("phraseGame.progress", { current: index + 1, total })}
        </span>
      </div>

      {showPrompt ? (
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink/40">
            {t("phraseGame.promptLabel")}
          </p>
          <p className="font-display text-xl text-ink sm:text-2xl">{promptText}</p>
        </div>
      ) : null}

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

      {/* In-phrase help + mid-round display toggles */}
      {submitted === null ? (
        <div className="flex flex-wrap gap-2">
          {!showPrompt ? (
            <HelpButton
              label={t("phraseGame.help.showFullPrompt")}
              onClick={() => {
                setReveal((r) => ({ ...r, fullPrompt: true }));
                logHelp("showFullPrompt");
              }}
            />
          ) : null}
          {hasExtras && !removedExtras ? (
            <HelpButton label={t("phraseGame.help.removeExtras")} onClick={handleRemoveExtras} />
          ) : null}
          <HelpButton
            label={t("phraseGame.help.showPinyin")}
            onClick={() => {
              setReveal((r) => ({ ...r, pinyin: true }));
              logHelp("showPinyin");
            }}
          />
          <HelpButton
            label={t("phraseGame.help.showTranslation")}
            onClick={() => {
              setReveal((r) => ({ ...r, translation: true }));
              logHelp("showTranslation");
            }}
          />
          <SpeakButton
            text={phrase.hanzi}
            label={t("phraseGame.help.listen")}
            variant="pill"
            onPlay={() => logHelp("listen")}
          />
          <HelpButton label={t("phraseGame.help.nextPiece")} onClick={handleNextPiece} />
        </div>
      ) : null}

      {submitted === null && !nativePromptDisabled(level) ? (
        <label className="flex cursor-pointer items-center gap-2 text-xs text-ink/55">
          <input
            type="checkbox"
            checked={settings.showNativePrompt}
            onChange={(e) => onSettingsChange({ ...settings, showNativePrompt: e.target.checked })}
            className="h-3.5 w-3.5 rounded border-ink/30 accent-accent"
          />
          {t("phraseGame.extra.showNativePrompt")}
        </label>
      ) : null}

      {/* Result feedback */}
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
          <div className="mt-2 space-y-1 text-sm text-ink/70">
            <div className="flex items-center gap-2">
              {submitted ? (
                <span className="font-hanzi text-lg text-ink">{phrase.hanzi}</span>
              ) : (
                <span>
                  {t("phraseGame.correctAnswer")}{" "}
                  <span className="font-hanzi text-lg text-ink">{phrase.hanzi}</span>
                </span>
              )}
              <SpeakButton text={phrase.hanzi} label={t("phraseGame.speak")} />
            </div>
            {phrase.pinyin ? <p>{phrase.pinyin}</p> : null}
            <p>{promptText}</p>
          </div>
        </div>
      ) : null}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {submitted === null ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
            style={{ backgroundColor: "var(--accent)" }}
          >
            {t("phraseGame.submit")}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className="rounded-xl px-6 py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--accent)" }}
          >
            {isLast ? t("phraseGame.finish") : t("phraseGame.next")}
          </button>
        )}
      </div>
    </div>
  );
}

function HelpButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border px-3 py-1.5 text-xs text-ink/65 transition-colors hover:bg-ink/5"
      style={{ borderColor: "var(--border)", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
    >
      {label}
    </button>
  );
}
