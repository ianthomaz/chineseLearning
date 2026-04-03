"use client";

import { BlockIndex } from "@/components/BlockIndex";
import { blocks } from "@/lib/blocks";
import { useLocale } from "@/context/LocaleContext";

type Mode = "review" | "vocabulary" | "grammar";

export function StudyModeIndex({ mode }: { mode: Mode }) {
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
    <main className="mx-auto max-w-5xl px-6 pb-24 pt-10">
      <p
        className="mb-2 text-xs font-medium uppercase tracking-widest text-ink/35"
        style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
      >
        {copy.kicker}
      </p>
      <h1 className="font-display text-3xl font-medium text-ink md:text-4xl">
        {copy.title}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink/55">
        {copy.intro}
      </p>
      <BlockIndex blocks={blocks} mode={mode} />
    </main>
  );
}
