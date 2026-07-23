"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ContextFlashcardSession } from "@/components/ContextFlashcardSession";
import { HanziWritingGame } from "@/components/HanziWritingGame";
import { SiteAttributionCredits } from "@/components/SiteAttributionCredits";
import { useLocale } from "@/context/LocaleContext";
import {
  findContextDeck,
  type ContextDeck,
  type ContextDeckMeta,
} from "@/lib/context-decks";
import type { PracticeLexicoCategory } from "@/lib/practice-library-types";

type Step = "hub" | "avulso" | "context-pick" | "context-deck";

type Props = {
  /** SQL lexico_* categories — only source for avulso. */
  lexicoCategories: PracticeLexicoCategory[];
  contextDecks: ContextDeck[];
  contextDeckMeta: ContextDeckMeta[];
};

export function RandomHanziClient({
  lexicoCategories,
  contextDecks,
  contextDeckMeta,
}: Props) {
  const { t, locale } = useLocale();
  const [step, setStep] = useState<Step>("hub");
  const decks = contextDeckMeta;
  const [activeDeck, setActiveDeck] = useState<ContextDeck | null>(null);
  const deckById = useMemo(() => {
    const m = new Map<string, ContextDeck>();
    for (const d of contextDecks) m.set(d.id, d);
    return m;
  }, [contextDecks]);

  const writingPools = useMemo(
    () =>
      lexicoCategories.map((c) => ({
        id: c.id,
        title: c.title,
        sortOrder: c.sortOrder,
        vocabulary: c.entries.map((e) => ({
          hanzi: e.hanzi,
          pinyin: e.pinyin,
          translation: e.translation,
        })),
      })),
    [lexicoCategories],
  );

  useEffect(() => {
    document.title = `${t("writingGame.pageDocTitle")} · ${t("metadata.siteTitle")}`;
  }, [t, locale]);

  function openContextDeck(id: string) {
    const deck = deckById.get(id) ?? findContextDeck(contextDecks, id);
    if (!deck) return;
    setActiveDeck(deck);
    setStep("context-deck");
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-6 sm:pt-10">
      {step === "hub" ? (
        <>
          <p
            className="text-xs font-medium uppercase tracking-widest text-ink/35"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {t("writingGame.pageKicker")}
          </p>
          <h1 className="mt-2 font-display text-2xl font-medium text-ink sm:text-3xl md:text-4xl">
            {t("writingGame.hubHeading")}
          </h1>
          <p
            className="mt-2 max-w-xl text-sm leading-relaxed text-ink/55 sm:text-base"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {t("writingGame.hubDesc")}
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-1 md:grid-cols-3">
            <Link
              href="/tutor"
              className="rounded-2xl border px-5 py-6 text-left transition-colors hover:bg-ink/[0.03]"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="font-hanzi text-3xl text-ink">聊</span>
              <span className="mt-3 block font-display text-lg font-medium text-ink">
                {t("writingGame.hubChat")}
              </span>
              <span
                className="mt-1 block text-sm leading-relaxed text-ink/55"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {t("writingGame.hubChatDesc")}
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setStep("avulso")}
              className="rounded-2xl border px-5 py-6 text-left transition-colors hover:bg-ink/[0.03]"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="font-hanzi text-3xl text-ink">写</span>
              <span className="mt-3 block font-display text-lg font-medium text-ink">
                {t("writingGame.hubAvulso")}
              </span>
              <span
                className="mt-1 block text-sm leading-relaxed text-ink/55"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {t("writingGame.hubAvulsoDesc")}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStep("context-pick")}
              className="rounded-2xl border px-5 py-6 text-left transition-colors hover:bg-ink/[0.03]"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="font-hanzi text-3xl text-ink">课</span>
              <span className="mt-3 block font-display text-lg font-medium text-ink">
                {t("writingGame.hubContext")}
              </span>
              <span
                className="mt-1 block text-sm leading-relaxed text-ink/55"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {t("writingGame.hubContextDesc")}
              </span>
            </button>
          </div>
        </>
      ) : null}

      {step === "avulso" ? (
        <>
          <button
            type="button"
            onClick={() => setStep("hub")}
            className="mb-4 text-sm font-medium text-accent hover:underline"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            ← {t("writingGame.back")}
          </button>
          <p
            className="text-xs font-medium uppercase tracking-widest text-ink/35"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {t("writingGame.pageKicker")}
          </p>
          <h1 className="mt-2 font-display text-2xl font-medium text-ink sm:text-3xl md:text-4xl">
            {t("writingGame.hubAvulso")}
          </h1>
          <p
            className="mt-2 max-w-xl text-sm leading-relaxed text-ink/55 sm:text-base"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {t("writingGame.pageDesc")}
          </p>
          <div className="mt-8">
            <HanziWritingGame pools={writingPools} embeddedInPage />
          </div>
        </>
      ) : null}

      {step === "context-pick" ? (
        <>
          <button
            type="button"
            onClick={() => setStep("hub")}
            className="mb-4 text-sm font-medium text-accent hover:underline"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            ← {t("writingGame.back")}
          </button>
          <h1 className="font-display text-2xl font-medium text-ink sm:text-3xl">
            {t("writingGame.contextPickHeading")}
          </h1>
          <p
            className="mt-2 max-w-xl text-sm leading-relaxed text-ink/55"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {t("writingGame.contextPickDesc")}
          </p>
          <ul className="mt-8 space-y-3">
            {decks.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => openContextDeck(d.id)}
                  className="w-full rounded-2xl border px-5 py-4 text-left transition-colors hover:bg-ink/[0.03]"
                  style={{ borderColor: "var(--border)" }}
                >
                  <span className="block font-display text-lg font-medium text-ink">
                    {d.title}
                  </span>
                  <span
                    className="mt-1 block text-sm text-ink/55"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {d.description}
                  </span>
                  <span
                    className="mt-2 block text-xs text-ink/40"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {t("writingGame.contextCardCount", { count: d.cardCount })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {step === "context-deck" && activeDeck ? (
        <ContextFlashcardSession
          key={activeDeck.id}
          deck={activeDeck}
          onBack={() => {
            setActiveDeck(null);
            setStep("context-pick");
          }}
        />
      ) : null}

      {step === "hub" || step === "avulso" ? (
        <footer
          className="mt-16 border-t border-ink/10 pb-[max(2rem,env(safe-area-inset-bottom,0px))] pt-10"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          <p className="mx-auto max-w-2xl text-center text-xs leading-relaxed text-ink/45">
            {t("writingGame.pageFooterVocab")}
          </p>
          <div className="mx-auto mt-8 max-w-3xl">
            <SiteAttributionCredits />
          </div>
        </footer>
      ) : null}
    </main>
  );
}
