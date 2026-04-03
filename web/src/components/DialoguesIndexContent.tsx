"use client";

import { DialogueConversation } from "@/components/DialogueTurnRow";
import { useLocale } from "@/context/LocaleContext";
import { globalDialogueSections } from "@/lib/global-dialogues";

export function DialoguesIndexContent() {
  const { t } = useLocale();

  return (
    <main className="mx-auto max-w-3xl px-6 pb-24 pt-10">
      <p
        className="mb-2 text-xs font-medium uppercase tracking-widest text-ink/35"
        style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
      >
        {t("dialogues.kicker")}
      </p>
      <h1 className="font-display text-3xl font-medium text-ink md:text-4xl">
        {t("dialogues.pageTitle")}
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink/55">
        {t("dialogues.pageIntro")}
      </p>

      <div className="mt-14 space-y-16">
        {globalDialogueSections.map((section) => (
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
