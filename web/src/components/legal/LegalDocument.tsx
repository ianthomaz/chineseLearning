"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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

const LANGUAGES: Array<{ code: LegalLocale; label: string }> = [
  { code: "pt", label: "Português" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "zh", label: "简体中文" },
];

export function LegalDocument({ kind }: Props) {
  const { locale, t } = useLocale();
  const searchParams = useSearchParams();

  const [selectedLang, setSelectedLang] = useState<LegalLocale>(() => {
    return locale === "pt" || locale === "es" ? locale : "en";
  });

  useEffect(() => {
    const queryLang = searchParams?.get("lang") as LegalLocale | null;
    if (queryLang && ["pt", "en", "es", "zh"].includes(queryLang)) {
      setSelectedLang(queryLang);
    } else if (locale === "pt" || locale === "es") {
      setSelectedLang(locale);
    } else {
      setSelectedLang("en");
    }
  }, [searchParams, locale]);

  const markdown = LEGAL_CONTENT[kind][selectedLang];

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 pb-[max(3rem,env(safe-area-inset-bottom,0px))] sm:px-6 sm:py-14">
      <header className="mb-8 border-b pb-6" style={{ borderColor: "var(--border)" }}>
        <p
          className="mb-2 text-xs font-medium uppercase tracking-widest text-ink/45"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          learnchinese.today
        </p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-2xl font-medium text-ink sm:text-3xl">
            {t(`legal.${kind}Title`)}
          </h1>
          <div
            className="flex flex-wrap gap-1 rounded-xl border p-1"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--paper)" }}
            role="tablist"
            aria-label="Idioma do documento"
          >
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                role="tab"
                aria-selected={selectedLang === lang.code}
                onClick={() => setSelectedLang(lang.code)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedLang === lang.code
                    ? "bg-accent text-white shadow-xs"
                    : "text-ink/65 hover:text-ink hover:bg-surface/50"
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </header>
      <BlockMarkdown markdown={markdown} />
    </article>
  );
}
