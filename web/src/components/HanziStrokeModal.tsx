"use client";

import HanziWriter from "hanzi-writer";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { useLocale } from "@/context/LocaleContext";

export type HanziStrokeModalProps = {
  open: boolean;
  onClose: () => void;
  /** Characters to show (e.g. one entry per hanzi in the vocabulary row). */
  characters: string[];
  /** Full word for context (title). */
  word: string;
  pinyin?: string;
};

export function HanziStrokeModal({
  open,
  onClose,
  characters,
  word,
  pinyin,
}: HanziStrokeModalProps) {
  const { t } = useLocale();
  const titleId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriter | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [quizDone, setQuizDone] = useState(false);
  const [inQuiz, setInQuiz] = useState(false);

  const activeChar = characters[activeIndex] ?? "";

  const disposeWriter = useCallback(() => {
    const w = writerRef.current;
    writerRef.current = null;
    if (w) {
      try {
        w.cancelQuiz();
        void w.pauseAnimation();
      } catch {
        /* ignore */
      }
    }
    if (containerRef.current) containerRef.current.innerHTML = "";
  }, []);

  useEffect(() => {
    if (!open) {
      disposeWriter();
    setLoadError(false);
    setQuizDone(false);
    setInQuiz(false);
    return;
  }
  setActiveIndex(0);
  setLoadError(false);
  setQuizDone(false);
  setInQuiz(false);
  }, [open, disposeWriter]);

  useEffect(() => {
    if (!open || !activeChar) return;
    const el = containerRef.current;
    if (!el) return;

    disposeWriter();
    setLoadError(false);
    setQuizDone(false);
    setInQuiz(false);

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const writer = HanziWriter.create(el, activeChar, {
      width: 280,
      height: 280,
      padding: 8,
      showOutline: true,
      showCharacter: false,
      strokeColor: "#1c1917",
      outlineColor: "#a8a29e",
      radicalColor: "#b45309",
      drawingColor: "#1c1917",
      highlightColor: "#0d9488",
      onLoadCharDataError: () => setLoadError(true),
    });

    writerRef.current = writer;

    // We don't auto-start quiz in the modal by default,
    // as it's often used just for reference.
    // But we still apply the width/height fix and can add analytics if needed.
    if (prefersReduced) {
      void writer.showOutline().then(() => writer.animateCharacter());
    } else {
      void writer.animateCharacter();
    }

    return () => {
      disposeWriter();
    };
  }, [open, activeChar, disposeWriter]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const replayAnimation = () => {
    const w = writerRef.current;
    if (!w || loadError) return;
    setQuizDone(false);
    setInQuiz(false);
    try {
      w.cancelQuiz();
    } catch {
      /* ignore */
    }
    void w.pauseAnimation().then(() => {
      void w.animateCharacter();
    });
  };

  const startQuiz = () => {
    const w = writerRef.current;
    if (!w || loadError) return;
    setQuizDone(false);
    setInQuiz(true);
    void w.pauseAnimation().then(() => {
      void w.quiz({
        /** Após 3 erros no mesmo traço, aceita e avança (não fica bloqueado). */
        markStrokeCorrectAfterMisses: 3,
        showHintAfterMisses: 2,
        onComplete: () => {
          setQuizDone(true);
          setInQuiz(false);
          trackEvent({
            action: "hanzi_drawn",
            category: "modal",
            label: activeChar,
          });
        },
      });
    });
  };

  const skipStroke = () => {
    const w = writerRef.current;
    if (!w || loadError) return;
    try {
      w.skipQuizStroke();
    } catch {
      /* ignore */
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-stone-900"
        aria-label={t("hanziWriter.closeAria")}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[101] w-full max-w-md rounded-2xl border border-stone-200 bg-white p-5 shadow-xl sm:p-6"
        style={{ backgroundColor: "#ffffff" }}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="font-display text-lg font-medium text-stone-900">
              {t("hanziWriter.modalTitle")}
            </h2>
            <p className="mt-1 font-hanzi text-2xl text-stone-900">
              {word}
              {pinyin ? (
                <span
                  className="ml-2 text-base font-normal italic text-stone-500"
                  style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
                >
                  {pinyin}
                </span>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-lg px-2 py-1 text-sm text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 active:bg-stone-200 active:text-stone-900"
            onClick={onClose}
          >
            {t("hanziWriter.close")}
          </button>
        </div>

        {characters.length > 1 ? (
          <div className="mb-4 flex flex-wrap gap-2">
            {characters.map((ch, i) => (
              <button
                key={`${ch}-${i}`}
                type="button"
                className={`rounded-lg border px-3 py-1.5 font-hanzi text-lg transition-all active:scale-[0.98] ${
                  i === activeIndex
                    ? "border-teal-600 bg-teal-50 text-stone-900 shadow-sm"
                    : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 active:bg-stone-200"
                }`}
                onClick={() => setActiveIndex(i)}
              >
                {ch}
              </button>
            ))}
          </div>
        ) : null}

        <div
          className="mx-auto flex min-h-[280px] w-full max-w-[280px] items-center justify-center rounded-xl border border-stone-200 shadow-inner"
          style={{ backgroundColor: "#ffffff" }}
        >
          {loadError ? (
            <p className="px-4 text-center text-sm text-stone-500">{t("hanziWriter.unavailable")}</p>
          ) : (
            <div
              ref={containerRef}
              className="hanzi-writer-host"
              style={{ width: "280px", height: "280px" }}
            />
          )}
        </div>

        {!loadError ? (
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg border-2 border-teal-600 bg-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-md transition-all hover:border-teal-700 hover:bg-teal-700 active:border-teal-800 active:bg-teal-800 active:shadow-inner active:translate-y-px"
                onClick={replayAnimation}
                title={inQuiz ? t("hanziWriter.replayExitQuiz") : undefined}
              >
                {t("hanziWriter.replay")}
              </button>
              <button
                type="button"
                disabled={inQuiz}
                className="rounded-lg border-2 border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-800 shadow-sm transition-all hover:border-stone-400 hover:bg-stone-50 disabled:pointer-events-none disabled:opacity-40 active:border-stone-500 active:bg-stone-100 active:shadow-inner active:translate-y-px"
                onClick={startQuiz}
              >
                {t("hanziWriter.quiz")}
              </button>
              {inQuiz ? (
                <button
                  type="button"
                  className="rounded-lg border-2 border-amber-600/80 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-950 shadow-sm transition-all hover:bg-amber-100 active:bg-amber-200 active:shadow-inner active:translate-y-px"
                  onClick={skipStroke}
                >
                  {t("hanziWriter.skipStroke")}
                </button>
              ) : null}
            </div>
            {inQuiz ? (
              <p className="text-xs leading-relaxed text-stone-500">{t("hanziWriter.quizHint")}</p>
            ) : null}
          </div>
        ) : null}

        {quizDone ? (
          <p className="mt-3 text-sm text-stone-600">{t("hanziWriter.quizDone")}</p>
        ) : null}

        <div className="mt-6 border-t border-stone-200 pt-4 text-[11px] leading-relaxed text-stone-500">
          <p>{t("hanziWriter.creditsModal")}</p>
          <p className="mt-2">
            <a
              href="https://github.com/chanind/hanzi-writer"
              target="_blank"
              rel="noreferrer"
              className="text-accent underline decoration-accent/30 underline-offset-2"
            >
              Hanzi Writer
            </a>
            {" · "}
            <a
              href="https://github.com/chanind/hanzi-writer-data"
              target="_blank"
              rel="noreferrer"
              className="text-accent underline decoration-accent/30 underline-offset-2"
            >
              hanzi-writer-data
            </a>
            {" · "}
            <a
              href="https://github.com/skishore/makemeahanzi"
              target="_blank"
              rel="noreferrer"
              className="text-accent underline decoration-accent/30 underline-offset-2"
            >
              Make Me a Hanzi
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
