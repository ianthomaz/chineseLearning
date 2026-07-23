"use client";

import dynamic from "next/dynamic";
import { useCallback, useState, type ReactNode } from "react";
import { useLocale } from "@/context/LocaleContext";
import { extractHanziFromWord } from "@/lib/hanzi-chars";
import type { ContextDeck, ContextDeckCard } from "@/lib/context-decks";

const HanziStrokeModal = dynamic(
  () =>
    import("@/components/HanziStrokeModal").then((m) => ({
      default: m.HanziStrokeModal,
    })),
  { ssr: false },
);

type Props = {
  deck: ContextDeck;
  onBack: () => void;
};

/** Highlight characters of `word` inside `sentence` (same idea as escrevendoHanzi/deck.html). */
function highlightWordInSentence(sentence: string, word: string): ReactNode {
  const chars = [...word].filter((ch) => ch.trim());
  if (!sentence || chars.length === 0) return sentence;
  return [...sentence].map((ch, i) =>
    chars.includes(ch) ? (
      <span key={i} className="text-[#ff5252]">
        {ch}
      </span>
    ) : (
      <span key={i}>{ch}</span>
    ),
  );
}

export function ContextFlashcardSession({ deck, onBack }: Props) {
  const { t } = useLocale();
  const [index, setIndex] = useState(0);
  const [strokeOpen, setStrokeOpen] = useState(false);

  const total = deck.cards.length;

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);
  const goNext = useCallback(() => {
    setIndex((i) => Math.min(Math.max(total - 1, 0), i + 1));
  }, [total]);

  if (total === 0) {
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-accent hover:underline self-start"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          ← {t("writingGame.back")}
        </button>
        <p className="text-sm text-ink/55" style={{ fontFamily: "var(--font-sans)" }}>
          {deck.title}
        </p>
      </div>
    );
  }

  const card: ContextDeckCard = deck.cards[index]!;
  const hanziChars = extractHanziFromWord(card.word);
  const canStroke = hanziChars.length > 0;

  const chipText = card.pattern
    ? card.patternLabel
      ? `${card.patternLabel}: ${card.pattern}`
      : deck.id === "liheci"
        ? `${t("writingGame.contextRecheio")}: ${card.pattern}`
        : card.pattern
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-accent hover:underline"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          ← {t("writingGame.back")}
        </button>
        <span
          className="text-xs text-ink/45"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {t("writingGame.progress", { current: index + 1, total })}
        </span>
      </div>

      <p
        className="text-center text-xs text-ink/40"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {deck.title}
        {card.section ? ` · ${card.section}` : ""}
      </p>

      <div className="flex flex-col items-center gap-2 py-4">
        <div className="font-hanzi text-5xl font-bold leading-tight tracking-wide text-ink sm:text-6xl">
          {card.word}
        </div>
        {card.pinyin ? (
          <div
            className="text-lg italic"
            style={{ color: "var(--accent-warm)" }}
          >
            {card.pinyin}
          </div>
        ) : null}
        {card.meaning ? (
          <div
            className="max-w-lg text-center text-base text-ink/70"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {card.meaning}
          </div>
        ) : null}
        {canStroke ? (
          <button
            type="button"
            onClick={() => setStrokeOpen(true)}
            className="mt-2 rounded-full border px-4 py-1.5 text-sm font-medium text-ink/80 transition-colors hover:bg-ink/[0.04]"
            style={{
              fontFamily: "var(--font-sans)",
              borderColor: "var(--border)",
            }}
          >
            {t("writingGame.contextStrokes")}
          </button>
        ) : null}
      </div>

      <div
        className="flex flex-col gap-3 border-t pt-4"
        style={{ borderColor: "var(--border)" }}
      >
        {chipText ? (
          <div className="flex justify-center">
            <span
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{
                color: "var(--accent-warm)",
                backgroundColor: "color-mix(in srgb, var(--accent-warm) 12%, transparent)",
                border: "1px solid color-mix(in srgb, var(--accent-warm) 35%, transparent)",
                fontFamily: "var(--font-sans)",
              }}
            >
              {chipText}
            </span>
          </div>
        ) : null}

        {card.sentence ? (
          <div className="font-hanzi text-center text-2xl font-semibold leading-snug text-ink sm:text-3xl">
            {highlightWordInSentence(card.sentence, card.word)}
          </div>
        ) : (
          <div className="text-center text-ink/30">—</div>
        )}
        {card.sentencePinyin ? (
          <div
            className="text-center text-sm italic sm:text-base"
            style={{ color: "var(--accent-warm)" }}
          >
            {card.sentencePinyin}
          </div>
        ) : null}
        {card.sentenceMeaning ? (
          <div
            className="text-center text-sm text-ink/60 sm:text-base"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {card.sentenceMeaning}
          </div>
        ) : null}

        {(card.related || card.patterns || card.notes) && (
          <div
            className="mt-2 space-y-1.5 rounded-xl border px-3 py-3 text-left text-xs leading-relaxed"
            style={{
              borderColor: "var(--border)",
              fontFamily: "var(--font-sans)",
              backgroundColor: "color-mix(in srgb, var(--ink) 2%, transparent)",
            }}
          >
            {card.related ? (
              <p>
                <span className="text-ink/40">{t("writingGame.contextRelated")} </span>
                <span className="text-ink/75">{card.related}</span>
              </p>
            ) : null}
            {card.patterns ? (
              <p>
                <span className="text-ink/40">{t("writingGame.contextPatterns")} </span>
                <span className="text-ink/75">{card.patterns}</span>
              </p>
            ) : null}
            {card.notes ? (
              <p>
                <span className="text-ink/40">{t("writingGame.contextNotes")} </span>
                <span className="text-ink/75">{card.notes}</span>
              </p>
            ) : null}
          </div>
        )}
      </div>

      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={goPrev}
          disabled={index === 0}
          className="flex-1 rounded-xl bg-ink/[0.06] py-3 text-base font-semibold text-ink disabled:opacity-35"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {t("writingGame.prev")}
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={index >= total - 1}
          className="flex-1 rounded-xl bg-ink/[0.06] py-3 text-base font-semibold text-ink disabled:opacity-35"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {t("writingGame.next")}
        </button>
      </div>

      <HanziStrokeModal
        open={strokeOpen}
        onClose={() => setStrokeOpen(false)}
        characters={hanziChars}
        word={card.word}
        pinyin={card.pinyin}
      />
    </div>
  );
}
