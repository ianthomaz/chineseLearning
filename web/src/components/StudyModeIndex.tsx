"use client";

import Link from "next/link";
import { BlockIndex } from "@/components/BlockIndex";
import type { BlockIndexEntry } from "@/lib/blocks-types";
import { Icon } from "@/components/ui/Icon";
import { useLocale } from "@/context/LocaleContext";

type Mode = "review" | "vocabulary" | "grammar";

export function StudyModeIndex({
  mode,
  blocks,
}: {
  mode: Mode;
  blocks: BlockIndexEntry[];
}) {
  const { t } = useLocale();

  const copy =
    mode === "review"
      ? {
          kicker: t("index.reviewKicker"),
          title: t("index.reviewTitle"),
          intro: t("index.reviewIntro"),
        }
      : mode === "vocabulary"
        ? {
            kicker: t("index.vocabKicker"),
            title: t("index.vocabTitle"),
            intro: t("index.vocabIntro"),
          }
        : {
            kicker: t("index.grammarKicker"),
            title: t("index.grammarTitle"),
            intro: t("index.grammarIntro"),
          };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-[max(6rem,env(safe-area-inset-bottom,0px))] pt-8 sm:px-6 sm:pb-24 sm:pt-10">
      <p
        className="mb-2 text-xs font-medium uppercase tracking-widest text-ink/35"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {copy.kicker}
      </p>
      <h1 className="font-display text-2xl font-medium text-ink sm:text-3xl md:text-4xl">
        {copy.title}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink/55">
        {copy.intro}
      </p>

      {mode === "vocabulary" && (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href="/practice"
            className="flex items-start gap-3.5 rounded-2xl border p-4 transition-all hover:bg-ink/[0.03] hover:border-accent/40"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent font-serif text-lg font-bold">
              字
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">
                  {t("index.vocabPracticeHanziTitle")}
                </p>
                <Icon name="arrowRight" size="1rem" className="text-ink/30" />
              </div>
              <p className="mt-0.5 text-xs text-ink/60">
                {t("index.vocabPracticeHanziDesc")}
              </p>
            </div>
          </Link>

          <Link
            href="#blocks-index"
            className="flex items-start gap-3.5 rounded-2xl border p-4 transition-all hover:bg-ink/[0.03] hover:border-accent/40"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent font-serif text-lg font-bold">
              句
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">
                  {t("index.vocabContextTitle")}
                </p>
                <Icon name="arrowRight" size="1rem" className="text-ink/30" />
              </div>
              <p className="mt-0.5 text-xs text-ink/60">
                {t("index.vocabContextDesc")}
              </p>
            </div>
          </Link>
        </div>
      )}

      <BlockIndex blocks={blocks} mode={mode} />
    </main>
  );
}
