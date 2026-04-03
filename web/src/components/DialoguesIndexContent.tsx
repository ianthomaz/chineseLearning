"use client";

import { useState } from "react";
import { DialogueConversation } from "@/components/DialogueTurnRow";
import { useLocale } from "@/context/LocaleContext";
import { globalDialogueSections } from "@/lib/global-dialogues";
import { blocks } from "@/lib/blocks";

export function DialoguesIndexContent() {
  const { t } = useLocale();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Filter dialogues by category if selected
  const filteredSections = selectedCategory
    ? globalDialogueSections.filter(
        (section) => !("categoryId" in section) || section.categoryId === selectedCategory
      )
    : globalDialogueSections;

  return (
    <main className="mx-auto max-w-3xl px-4 pb-[max(6rem,env(safe-area-inset-bottom,0px))] pt-8 sm:px-6 sm:pb-24 sm:pt-10">
      <p
        className="mb-2 text-xs font-medium uppercase tracking-widest text-ink/35"
        style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
      >
        {t("dialogues.kicker")}
      </p>
      <h1 className="font-display text-2xl font-medium text-ink sm:text-3xl md:text-4xl">
        {t("dialogues.pageTitle")}
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink/55">
        {t("dialogues.pageIntro")}
      </p>

      {/* Category Filter */}
      <div className="mt-8 flex items-center gap-3">
        <label htmlFor="category-select" className="text-sm font-medium text-ink">
          {t("dialogues.filterLabel")}
        </label>
        <select
          id="category-select"
          value={selectedCategory ?? ""}
          onChange={(e) =>
            setSelectedCategory(e.target.value === "" ? null : Number(e.target.value))
          }
          className="rounded border px-3 py-2 text-sm"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
        >
          <option value="">{t("dialogues.allCategories")}</option>
          {blocks.map((block) => (
            <option key={block.id} value={block.id}>
              {t(`blockTitles.${block.id}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-14 space-y-16">
        {filteredSections.map((section) => (
          <section key={section.id}>
            <h2
              className="mb-6 border-b pb-2 font-display text-xl font-medium text-ink"
              style={{ borderColor: "var(--border)" }}
            >
              {t(`dialogues.global.${section.id}`)}
            </h2>
            <DialogueConversation turns={section.lines} />
          </section>
        ))}
      </div>
    </main>
  );
}
