"use client";

import { BlockMarkdown } from "@/components/BlockMarkdown";
import { useLocale } from "@/context/LocaleContext";
import {
  LEGAL_CONTENT,
  type LegalKind,
  type LegalLocale,
} from "@/content/legal/content";

type Props = {
  kind: LegalKind;
};

export function LegalDocument({ kind }: Props) {
  const { locale, t } = useLocale();
  const lang: LegalLocale = locale === "pt" || locale === "es" ? locale : "en";
  const markdown = LEGAL_CONTENT[kind][lang];

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 pb-[max(3rem,env(safe-area-inset-bottom,0px))] sm:px-6 sm:py-14">
      <header className="mb-8 border-b pb-6" style={{ borderColor: "var(--border)" }}>
        <p
          className="mb-2 text-xs font-medium uppercase tracking-widest text-ink/45"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          learnchinese.today
        </p>
        <h1 className="font-display text-2xl font-medium text-ink sm:text-3xl">
          {t(`legal.${kind}Title`)}
        </h1>
      </header>
      <BlockMarkdown markdown={markdown} />
    </article>
  );
}
