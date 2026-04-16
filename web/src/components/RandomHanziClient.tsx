"use client";

import { useEffect } from "react";
import { HanziWritingGame } from "@/components/HanziWritingGame";
import { SiteAttributionCredits } from "@/components/SiteAttributionCredits";
import { useLocale } from "@/context/LocaleContext";
import type { ContentBlock } from "@/lib/blocks";

type Props = {
  blocks: ContentBlock[];
  /** From `?autostart=1` — begin a session as soon as the practice page loads. */
  autoStartSession?: boolean;
};

export function RandomHanziClient({ blocks, autoStartSession = false }: Props) {
  const { t, locale } = useLocale();

  useEffect(() => {
    document.title = `${t("writingGame.pageDocTitle")} · ${t("metadata.siteTitle")}`;
  }, [t, locale]);

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-6 sm:pt-10">
      <p
        className="text-xs font-medium uppercase tracking-widest text-ink/35"
        style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
      >
        {t("writingGame.pageKicker")}
      </p>
      <h1 className="mt-2 font-display text-2xl font-medium text-ink sm:text-3xl">
        {t("writingGame.pageHeading")}
      </h1>
      <p
        className="mt-2 max-w-xl text-sm leading-relaxed text-ink/55 sm:text-base"
        style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
      >
        {t("writingGame.pageDesc")}
      </p>
      <div className="mt-8">
        <HanziWritingGame
          blocks={blocks}
          embeddedInPage
          autoStartSession={autoStartSession}
        />
      </div>

      <footer
        className="mt-16 border-t border-ink/10 pb-[max(2rem,env(safe-area-inset-bottom,0px))] pt-10"
        style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
      >
        <p className="mx-auto max-w-2xl text-center text-xs leading-relaxed text-ink/45">
          {t("writingGame.pageFooterVocab")}
        </p>
        <div className="mx-auto mt-8 max-w-3xl">
          <SiteAttributionCredits />
        </div>
      </footer>
    </main>
  );
}
