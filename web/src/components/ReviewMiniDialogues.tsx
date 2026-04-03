"use client";

import { DialogueConversation } from "@/components/DialogueTurnRow";
import { useLocale } from "@/context/LocaleContext";
import type { DialogueTurn } from "@/lib/blocks";

type Props = {
  conversations: DialogueTurn[][];
};

export function ReviewMiniDialogues({ conversations }: Props) {
  const { t } = useLocale();

  if (!conversations.length) return null;

  return (
    <section className="mt-14">
      <h2
        className="mb-8 text-xs font-semibold uppercase tracking-widest text-ink/40"
        style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
      >
        {t("review.miniDialoguesTitle")}
      </h2>
      <div className="space-y-8">
        {conversations.map((conv, ci) => (
          <div
            key={ci}
            className="rounded-xl border p-4 sm:p-5"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "rgba(28,25,23,0.02)",
            }}
          >
            <p
              className="mb-3 text-[10px] font-medium uppercase tracking-wider text-ink/35"
              style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
            >
              {t("dialogues.convLabel", { num: ci + 1 })}
            </p>
            <DialogueConversation turns={conv} phraseReveal />
          </div>
        ))}
      </div>
    </section>
  );
}
