"use client";

import Link from "next/link";
import { useEffect } from "react";
import { BlockPager } from "@/components/BlockPager";
import { BlockTitleText } from "@/components/BlockTitleText";
import { CrossLinks } from "@/components/CrossLinks";
import { GrammarSections } from "@/components/GrammarSections";
import { PriorityList } from "@/components/PriorityList";
import { ReviewMiniDialogues } from "@/components/ReviewMiniDialogues";
import { ReviewStructures } from "@/components/ReviewStructures";
import { VocabTable } from "@/components/VocabTable";
import type { ContentBlock } from "@/lib/blocks";
import { localizedBlockTitle } from "@/lib/block-title";
import { useLocale } from "@/context/LocaleContext";

type Mode = "review" | "vocabulary" | "grammar";

type Props = {
  mode: Mode;
  block: ContentBlock;
};

function BlockStudyDocumentTitle({
  block,
  mode,
}: {
  block: ContentBlock;
  mode: Mode;
}) {
  const { t, locale } = useLocale();
  useEffect(() => {
    const loc = localizedBlockTitle(block.id, block.title, t);
    const section = t(`nav.${mode}`);
    document.title = `${section} · ${loc} · ${t("metadata.siteTitle")}`;
  }, [block.id, block.title, mode, locale, t]);
  return null;
}

export function BlockStudyPage({ mode, block }: Props) {
  const { t } = useLocale();
  const num = String(block.id).padStart(2, "0");

  const headerKey =
    mode === "review"
      ? "block.headerReview"
      : mode === "vocabulary"
        ? "block.headerVocab"
        : "block.headerGrammar";

  return (
    <main className="mx-auto max-w-3xl px-6 pb-24 pt-10">
      <BlockStudyDocumentTitle block={block} mode={mode} />
      <div className={mode === "review" ? "mb-12" : "mb-10"}>
        <p
          className="mb-2 text-xs font-medium uppercase tracking-widest text-ink/35"
          style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
        >
          {t(headerKey, { num })}
        </p>
        <h1 className="font-display text-3xl font-medium text-ink md:text-4xl">
          <BlockTitleText id={block.id} title={block.title} />
        </h1>
        {mode === "vocabulary" && block.vocabulary.length > 0 ? (
          <p
            className="mt-2 text-sm text-ink/40"
            style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
          >
            {block.vocabulary.length === 1
              ? t("home.wordCountOne")
              : t("home.wordCount", { count: block.vocabulary.length })}
          </p>
        ) : null}
        {mode === "vocabulary" ? (
          <p className="mt-3 text-sm text-ink/50">
            {t("vocab.grammarLink")}{" "}
            <Link
              href={`/grammar/${block.id}`}
              className="text-accent underline decoration-accent/30"
            >
              {t("vocab.grammarOpen")}
            </Link>
            .
          </p>
        ) : null}
        {mode === "grammar" ? (
          <p className="mt-3 text-sm text-ink/50">
            {t("grammar.vocabLink")}{" "}
            <Link
              href={`/vocabulary/${block.id}`}
              className="text-accent underline decoration-accent/30"
            >
              {t("grammar.vocabOpen")}
            </Link>
            .
          </p>
        ) : null}
      </div>

      {mode === "review" ? (
        <>
          <ReviewStructures
            blockId={block.id}
            lines={block.structures}
            structureGlosses={block.structureGlosses}
          />
          <ReviewMiniDialogues conversations={block.reviewMiniDialogues} />
          <PriorityList
            items={block.priorities}
            blockId={block.id}
            studyMode="review"
          />
          {block.id === 15 && block.vocabulary.length > 0 ? (
            <section className="mt-14">
              <h2
                className="mb-1 text-xs font-semibold uppercase tracking-widest text-ink/40"
                style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
              >
                {t("vocab.studyTitle")}
              </h2>
              <p className="mb-5 text-sm text-ink/50">{t("vocab.studyHint")}</p>
              <VocabTable rows={block.vocabulary} />
            </section>
          ) : null}
        </>
      ) : null}

      {mode === "vocabulary" ? (
        <>
          {block.vocabulary.length > 0 ? (
            <VocabTable rows={block.vocabulary} />
          ) : (
            <p className="text-sm text-ink/50">{t("vocab.noTable")}</p>
          )}
          {block.id === 15 && block.priorities.length > 0 ? (
            <div className="mt-14">
              <PriorityList
                items={block.priorities}
                blockId={15}
                studyMode="vocabulary"
              />
            </div>
          ) : null}
        </>
      ) : null}

      {mode === "grammar" ? (
        <GrammarSections
          blockId={block.id}
          structures={block.structures}
          notes={block.notes}
          differences={block.differences}
          priorities={block.priorities}
        />
      ) : null}

      <CrossLinks blockId={block.id} current={mode} />
      <BlockPager blockId={block.id} mode={mode} />
    </main>
  );
}
