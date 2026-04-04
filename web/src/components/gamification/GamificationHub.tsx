"use client";

import { ChineseWithPinyinLine } from "@/components/ChineseWithPinyinLine";
import {
  localizedOptions,
  localizedQuestionPrompt,
  questionTypeDisplayName,
  quizBank,
} from "@/lib/gamification";
import { useLocale } from "@/context/LocaleContext";

export function GamificationHub() {
  const { locale, t } = useLocale();
  const { metadata, question_types: questionTypes, questions } = quizBank;
  const target =
    metadata.target_question_count ?? metadata.total_questions;
  const preview = questions.find((q) => q.type === "multiple_choice") ?? questions[0];
  const previewOptions = preview ? localizedOptions(preview, locale) : [];
  const previewTypeSpec = preview ? questionTypes[preview.type] : undefined;

  return (
    <main className="mx-auto max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <p className="font-display text-sm font-medium tracking-wide text-accent">
        HSK {metadata.hsk_level}
      </p>
      <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        {t("gamification.title")}
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink/75">
        {t("gamification.intro")}
      </p>

      <ul
        className="mt-8 grid gap-3 sm:grid-cols-2"
        aria-label={t("gamification.statsLabel")}
      >
        <li
          className="rounded-2xl border px-4 py-3"
          style={{ borderColor: "var(--border)" }}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-ink/45">
            {t("gamification.statQuestions")}
          </p>
          <p className="mt-1 font-display text-xl font-semibold text-ink">
            {metadata.total_questions}
            {target > metadata.total_questions ? (
              <span className="text-base font-normal text-ink/50">
                {" "}
                / {target}
              </span>
            ) : null}
          </p>
        </li>
        <li
          className="rounded-2xl border px-4 py-3"
          style={{ borderColor: "var(--border)" }}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-ink/45">
            {t("gamification.statBlocks")}
          </p>
          <p className="mt-1 font-display text-xl font-semibold text-ink">
            {metadata.blocks_covered.length}
          </p>
        </li>
      </ul>

      <section className="mt-10" aria-labelledby="gamification-types-heading">
        <h2
          id="gamification-types-heading"
          className="font-display text-lg font-semibold text-ink"
        >
          {t("gamification.typesHeading")}
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-ink/80">
          {Object.entries(questionTypes).map(([key, spec]) => (
            <li
              key={key}
              className="flex flex-col gap-0.5 rounded-xl border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="font-medium text-ink">
                {questionTypeDisplayName(spec, locale)}
              </span>
              <span className="font-mono text-xs text-ink/45">{spec.layout}</span>
            </li>
          ))}
        </ul>
      </section>

      {preview ? (
        <section
          className="mt-10 rounded-2xl border p-4 sm:p-6"
          style={{ borderColor: "var(--border)" }}
          aria-labelledby="gamification-preview-heading"
        >
          <h2
            id="gamification-preview-heading"
            className="font-display text-lg font-semibold text-ink"
          >
            {t("gamification.previewHeading")}
          </h2>
          <p className="mt-1 text-sm text-ink/55">{t("gamification.previewHint")}</p>
          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-ink/45">
            {previewTypeSpec
              ? questionTypeDisplayName(previewTypeSpec, locale)
              : preview.type}{" "}
            · {t("gamification.blockLabel", { n: String(preview.block) })}
          </p>
          {preview.hanzi.trim() ? (
            <div className="mt-3">
              <ChineseWithPinyinLine hanzi={preview.hanzi} pinyin={preview.pinyin} />
            </div>
          ) : null}
          <p className="mt-4 text-base leading-relaxed text-ink">
            {localizedQuestionPrompt(preview, locale)}
          </p>
          {previewOptions.length > 0 ? (
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-ink/85">
              {previewOptions.map((opt, i) => (
                <li key={i}>{opt}</li>
              ))}
            </ol>
          ) : null}
        </section>
      ) : null}

      <p className="mt-8 text-sm text-ink/55">{t("gamification.roadmap")}</p>
    </main>
  );
}
