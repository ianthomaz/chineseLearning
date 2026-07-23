"use client";

import Link from "next/link";
import { BlockTitleText } from "@/components/BlockTitleText";
import type { ContentBlock } from "@/lib/blocks-types";
import { useLocale } from "@/context/LocaleContext";

type NavGridCard = {
  href: string;
  modeKey:
    | "review"
    | "vocabulary"
    | "visuals"
    | "grammar"
    | "dialogues"
    | "gamification"
    | "phraseGame"
    | "tutor";
  hanzi: string;
  color: string;
  descKey: string;
};

const homeGridCards: ReadonlyArray<NavGridCard> = [
  {
    href: "/review",
    modeKey: "review",
    hanzi: "复习",
    color: "var(--accent)",
    descKey: "home.modeReviewDesc",
  },
  {
    href: "/vocabulary",
    modeKey: "vocabulary",
    hanzi: "词汇",
    color: "var(--accent-warm)",
    descKey: "home.modeVocabDesc",
  },
  {
    href: "/visuals",
    modeKey: "visuals",
    hanzi: "图",
    color: "var(--cat-amber)",
    descKey: "home.modeVisualsDesc",
  },
  {
    href: "/grammar",
    modeKey: "grammar",
    hanzi: "语法",
    color: "var(--cat-green)",
    descKey: "home.modeGrammarDesc",
  },
  {
    href: "/dialogues",
    modeKey: "dialogues",
    hanzi: "对话",
    color: "var(--cat-purple)",
    descKey: "home.modeDialoguesDesc",
  },
  {
    href: "/gamification",
    modeKey: "gamification",
    hanzi: "测",
    color: "var(--accent-2)",
    descKey: "home.modeQuizDesc",
  },
  {
    href: "/phrase-game",
    modeKey: "phraseGame",
    hanzi: "拼",
    color: "var(--cat-violet)",
    descKey: "home.modePhraseGameDesc",
  },
  {
    href: "/praticar",
    modeKey: "tutor",
    hanzi: "练",
    color: "var(--cat-orange)",
    descKey: "home.modeTutorDesc",
  },
];

type Props = {
  blocks: ContentBlock[];
};

export function HomeContent({ blocks }: Props) {
  const { t } = useLocale();

  return (
    <main className="mx-auto max-w-5xl px-4 pb-[max(6rem,env(safe-area-inset-bottom,0px))] sm:px-6 sm:pb-24">
      <section className="py-10 sm:py-16 md:py-20">
        <p
          className="mb-4 text-xs font-medium uppercase tracking-widest"
          style={{ color: "var(--accent)", fontFamily: "var(--font-sans)" }}
        >
          {t("home.kicker")}
        </p>
        <h1 className="font-display text-3xl font-medium leading-tight tracking-tight text-ink sm:text-4xl md:text-5xl">
          {t("home.title1")}
          <br />
          <span className="text-ink/40">{t("home.title2")}</span>
        </h1>
        <p className="mt-5 max-w-lg text-base leading-relaxed text-ink/60 sm:text-lg">
          {t("home.blurb")}
        </p>
      </section>

      <section>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {homeGridCards.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 transition-shadow active:bg-ink/[0.02] sm:p-6 sm:hover:shadow-md"
            >
              <div
                className="mb-4 inline-flex items-center justify-center rounded-xl px-3 py-1.5"
                style={{ backgroundColor: `color-mix(in srgb, ${m.color} 14%, transparent)` }}
              >
                <span
                  className="font-hanzi text-lg font-bold"
                  style={{ color: m.color }}
                >
                  {m.hanzi}
                </span>
              </div>
              <h2
                className="font-display text-xl font-medium text-ink"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "1rem",
                  fontWeight: 600,
                }}
              >
                {t(`nav.${m.modeKey}`)}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/55">
                {t(m.descKey)}
              </p>
              <span
                className="mt-4 inline-block text-xs font-medium transition-colors group-hover:opacity-100"
                style={{
                  color: m.color,
                  fontFamily: "var(--font-sans)",
                  opacity: 0.7,
                }}
              >
                {t("home.open")}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-16 border-t pt-12" style={{ borderColor: "var(--border)" }}>
        <div className="mb-6 flex items-baseline justify-between">
          <h2
            className="text-sm font-semibold uppercase tracking-widest text-ink/40"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {t("home.blocksTitle")}
          </h2>
          <span
            className="text-xs text-ink/35"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {t("home.blocksCount", { count: blocks.length })}
          </span>
        </div>
        <ol className="grid gap-2 sm:grid-cols-2">
          {blocks.map((b) => (
            <li key={b.id}>
              <Link
                href={`/review/${b.id}`}
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-ink/5"
              >
                <span
                  className="w-7 shrink-0 text-right text-xs tabular-nums text-ink/30"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {String(b.id).padStart(2, "0")}
                </span>
                <span className="text-sm text-ink/80 transition-colors group-hover:text-ink">
                  <BlockTitleText id={b.id} title={b.title} />
                </span>
                {b.vocabulary.length > 0 ? (
                  <span
                    className="ml-auto shrink-0 text-xs text-ink/25"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {b.vocabulary.length === 1
                      ? t("home.wordCountOne")
                      : t("home.wordCount", { count: b.vocabulary.length })}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
