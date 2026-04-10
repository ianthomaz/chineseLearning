"use client";

import HanziWriter from "hanzi-writer";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useLocale } from "@/context/LocaleContext";
import { blocks } from "@/lib/blocks";
import { extractHanziFromWord } from "@/lib/hanzi-chars";
import type { VocabRow, ContentBlock } from "@/lib/blocks";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GameState = "idle" | "playing" | "done";

type GameCard = {
  vocab: VocabRow;
  blockId: number;
  blockTitle: string;
  chars: string[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickRandom<T>(arr: T[], n: number): T[] {
  return shuffled(arr).slice(0, n);
}

function buildSession(): { cards: GameCard[]; ok: boolean } {
  const eligible = blocks.filter(
    (b) => b.vocabulary.filter((v) => extractHanziFromWord(v.hanzi).length > 0).length >= 5,
  );

  if (eligible.length < 2) return { cards: [], ok: false };

  const [blockA, blockB] = pickRandom(eligible, 2);

  const validVocab = (b: ContentBlock) =>
    b.vocabulary.filter((v) => extractHanziFromWord(v.hanzi).length > 0);

  const makeCards = (vocabList: VocabRow[], b: ContentBlock): GameCard[] =>
    vocabList.map((v) => ({
      vocab: v,
      blockId: b.id,
      blockTitle: b.title,
      chars: extractHanziFromWord(v.hanzi),
    }));

  const cards = [
    ...makeCards(pickRandom(validVocab(blockA), 5), blockA),
    ...makeCards(pickRandom(validVocab(blockB), 5), blockB),
  ];

  return { cards, ok: true };
}

// ---------------------------------------------------------------------------
// Inline HanziWriter (no modal — lives inside the game card)
// ---------------------------------------------------------------------------

function InlineHanziWriter({ characters }: { characters: string[] }) {
  const { t } = useLocale();
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

  // Reset when active character changes (different char tab or new card via key)
  useEffect(() => {
    if (!activeChar) return;
    const el = containerRef.current;
    if (!el) return;

    disposeWriter();
    setLoadError(false);
    setQuizDone(false);
    setInQuiz(false);

    const writer = HanziWriter.create(el, activeChar, {
      width: 220,
      height: 220,
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
    void writer.loopCharacterAnimation();

    return () => {
      disposeWriter();
    };
  }, [activeChar, disposeWriter]);

  const replayAnimation = useCallback(() => {
    const w = writerRef.current;
    if (!w || loadError) return;
    setQuizDone(false);
    setInQuiz(false);
    try {
      w.cancelQuiz();
    } catch {
      /* ignore */
    }
    void w.pauseAnimation().then(() => void w.loopCharacterAnimation());
  }, [loadError]);

  const startQuiz = useCallback(() => {
    const w = writerRef.current;
    if (!w || loadError || inQuiz) return;
    setQuizDone(false);
    setInQuiz(true);
    void w.pauseAnimation().then(() => {
      void w.quiz({
        markStrokeCorrectAfterMisses: 3,
        showHintAfterMisses: 2,
        onComplete: () => {
          setQuizDone(true);
          setInQuiz(false);
        },
      });
    });
  }, [loadError, inQuiz]);

  const skipStroke = useCallback(() => {
    try {
      writerRef.current?.skipQuizStroke();
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div>
      {/* Character tabs for multi-character words */}
      {characters.length > 1 && (
        <div className="mb-3 flex flex-wrap justify-center gap-2">
          {characters.map((ch, i) => (
            <button
              key={`${ch}-${i}`}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`rounded-lg border px-3 py-1.5 font-hanzi text-lg transition-all active:scale-[0.98] ${
                i === activeIndex
                  ? "border-teal-600 bg-teal-50 text-stone-900 shadow-sm"
                  : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 active:bg-stone-200"
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      )}

      {/* Drawing canvas */}
      <div className="mx-auto flex min-h-[220px] w-full max-w-[220px] items-center justify-center rounded-xl border border-stone-200 bg-white shadow-inner">
        {loadError ? (
          <p className="px-4 text-center text-sm text-stone-500">
            {t("hanziWriter.unavailable")}
          </p>
        ) : (
          <div ref={containerRef} className="hanzi-writer-host" />
        )}
      </div>

      {/* Controls */}
      {!loadError && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={replayAnimation}
            className="rounded-lg border-2 border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-800 shadow-sm transition-all hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100 active:shadow-inner"
          >
            {t("hanziWriter.replay")}
          </button>
          <button
            type="button"
            onClick={startQuiz}
            disabled={inQuiz}
            className="rounded-lg border-2 border-teal-600 bg-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-teal-700 disabled:pointer-events-none disabled:opacity-40 active:bg-teal-800 active:translate-y-px active:shadow-inner"
          >
            {t("hanziWriter.quiz")}
          </button>
          {inQuiz && (
            <button
              type="button"
              onClick={skipStroke}
              className="rounded-lg border-2 border-amber-600/80 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-950 shadow-sm transition-all hover:bg-amber-100 active:bg-amber-200 active:translate-y-px"
            >
              {t("hanziWriter.skipStroke")}
            </button>
          )}
        </div>
      )}

      {inQuiz && (
        <p className="mt-2 text-center text-xs leading-relaxed text-stone-500">
          {t("hanziWriter.quizHint")}
        </p>
      )}
      {quizDone && (
        <p className="mt-2 text-center text-sm font-medium text-teal-700">
          {t("hanziWriter.quizDone")}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main game component
// ---------------------------------------------------------------------------

export function HanziWritingGame() {
  const { t } = useLocale();
  const [state, setState] = useState<GameState>("idle");
  const [cards, setCards] = useState<GameCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const blockTitles = useMemo(() => {
    const seen = new Set<number>();
    const titles: string[] = [];
    for (const c of cards) {
      if (!seen.has(c.blockId)) {
        seen.add(c.blockId);
        titles.push(c.blockTitle);
      }
    }
    return titles;
  }, [cards]);

  const startSession = useCallback(() => {
    const session = buildSession();
    if (!session.ok) return;
    setCards(session.cards);
    setCurrentIndex(0);
    setState("playing");
  }, []);

  const goNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setState("done");
    }
  }, [currentIndex, cards.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  }, [currentIndex]);

  const currentCard = cards[currentIndex];

  // --- Idle ---
  if (state === "idle") {
    return (
      <section className="mt-12">
        <div
          className="rounded-2xl border p-6 sm:p-8"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--paper)" }}
        >
          <div className="flex items-start gap-5">
            <div
              className="hidden shrink-0 items-center justify-center rounded-xl px-3 py-1.5 sm:inline-flex"
              style={{ backgroundColor: "#0d948815" }}
            >
              <span className="font-hanzi text-2xl font-bold" style={{ color: "#0d9488" }}>
                写
              </span>
            </div>
            <div className="flex-1">
              <h2
                className="text-base font-semibold text-ink"
                style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
              >
                {t("writingGame.sectionTitle")}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/55">
                {t("writingGame.sectionDesc")}
              </p>
              <button
                type="button"
                onClick={startSession}
                className="mt-5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80"
                style={{ backgroundColor: "#0d9488" }}
              >
                {t("writingGame.start")}
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // --- Done ---
  if (state === "done") {
    return (
      <section className="mt-12">
        <div
          className="rounded-2xl border p-6 sm:p-8"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--paper)" }}
        >
          <p
            className="text-xs font-medium uppercase tracking-widest text-ink/40"
            style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
          >
            {t("writingGame.sectionTitle")}
          </p>
          <p className="mt-3 text-lg font-semibold text-ink">{t("writingGame.done")}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink/55">
            {t("writingGame.doneDesc", { blocks: blockTitles.join(" · ") })}
          </p>
          <button
            type="button"
            onClick={startSession}
            className="mt-5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80"
            style={{ backgroundColor: "#0d9488" }}
          >
            {t("writingGame.newSession")}
          </button>
        </div>
      </section>
    );
  }

  // --- Playing ---
  if (!currentCard) return null;

  return (
    <section className="mt-12">
      <div
        className="rounded-2xl border p-6 sm:p-8"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--paper)" }}
      >
        {/* Header row */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p
              className="text-xs font-medium uppercase tracking-widest text-ink/40"
              style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
            >
              {t("writingGame.sectionTitle")}
            </p>
            <p
              className="mt-0.5 text-xs text-ink/35"
              style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
            >
              {t("writingGame.blockBadge", {
                id: String(currentCard.blockId),
                title: currentCard.blockTitle,
              })}
            </p>
          </div>
          <span
            className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: "#0d9488" }}
          >
            {t("writingGame.progress", {
              current: currentIndex + 1,
              total: cards.length,
            })}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-6 h-1.5 w-full rounded-full bg-ink/10">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / cards.length) * 100}%`,
              backgroundColor: "#0d9488",
            }}
          />
        </div>

        {/* Vocab label */}
        <div className="mb-5 text-center">
          <p className="font-hanzi text-5xl font-bold text-ink">{currentCard.vocab.hanzi}</p>
          <p
            className="mt-2 text-base text-ink/55"
            style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
          >
            {currentCard.vocab.pinyin}
          </p>
          <p
            className="mt-1 text-sm text-ink/40"
            style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
          >
            {currentCard.vocab.translation}
          </p>
        </div>

        {/* Writing canvas — key forces full remount on card change */}
        <InlineHanziWriter
          key={`${currentIndex}-${currentCard.vocab.hanzi}`}
          characters={currentCard.chars}
        />

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-ink/60 transition-colors hover:bg-ink/5 disabled:pointer-events-none disabled:opacity-30"
            style={{ borderColor: "var(--border)" }}
          >
            {t("writingGame.prev")}
          </button>
          <button
            type="button"
            onClick={goNext}
            className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80"
            style={{ backgroundColor: "#0d9488" }}
          >
            {currentIndex === cards.length - 1
              ? t("writingGame.finish")
              : t("writingGame.next")}
          </button>
        </div>
      </div>
    </section>
  );
}
