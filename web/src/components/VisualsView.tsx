"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/context/LocaleContext";
import type { VocabPdfRow } from "@/lib/vocabulary-pdf-downloads";
import {
  vocabPdfDescription,
  vocabPdfTitle,
  vocabularyPdfDownloads,
} from "@/lib/vocabulary-pdf-downloads";
import { VisualPdfPager } from "@/components/VisualPdfPager";
import { withPublicBasePath } from "@/lib/publicBasePath";

export function VisualsView() {
  const { locale, t } = useLocale();
  const { pdfs } = vocabularyPdfDownloads;
  const [active, setActive] = useState(0);
  const [compactPortrait, setCompactPortrait] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);
  const [orientMsg, setOrientMsg] = useState<string | null>(null);

  const row: VocabPdfRow | undefined = pdfs[active];

  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait) and (max-width: 767px)");
    const sync = () => setCompactPortrait(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const showPortraitHint = compactPortrait && !hintDismissed && pdfs.length > 0;

  const tryLandscape = useCallback(async () => {
    setOrientMsg(null);
    try {
      const o = screen.orientation as ScreenOrientation & {
        lock?: (orientation: string) => Promise<void>;
      };
      if (typeof o?.lock === "function") {
        await o.lock("landscape-primary");
      } else {
        setOrientMsg(t("visuals.landscapeUnsupported"));
      }
    } catch {
      setOrientMsg(t("visuals.landscapeFail"));
    }
  }, [t]);

  const desc = row ? vocabPdfDescription(row, locale) : undefined;

  return (
    <main className="mx-auto max-w-5xl px-4 pb-[max(6rem,env(safe-area-inset-bottom,0px))] pt-8 sm:px-6 sm:pb-24 sm:pt-10">
      <p
        className="mb-2 text-xs font-medium uppercase tracking-widest text-ink/35"
        style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
      >
        {t("visuals.kicker")}
      </p>
      <h1 className="font-display text-2xl font-medium text-ink sm:text-3xl md:text-4xl">
        {t("visuals.title")}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink/55">{t("visuals.intro")}</p>

      {pdfs.length === 0 ? (
        <p className="mt-6 text-sm leading-relaxed text-ink/55">{t("visuals.empty")}</p>
      ) : (
        <>
          {showPortraitHint ? (
            <div
              className="mt-4 flex flex-col gap-3 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between"
              role="status"
            >
              <p className="min-w-0 flex-1 leading-relaxed">{t("visuals.landscapeHint")}</p>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={tryLandscape}
                  className="rounded-lg border border-amber-300/80 bg-white px-3 py-2 text-xs font-medium text-amber-950 transition-colors hover:bg-amber-100/80"
                  style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
                >
                  {t("visuals.landscapeButton")}
                </button>
                <button
                  type="button"
                  onClick={() => setHintDismissed(true)}
                  className="rounded-lg px-3 py-2 text-xs text-amber-900/70 underline decoration-amber-400/60 underline-offset-2"
                  style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
                >
                  {t("visuals.landscapeDismiss")}
                </button>
              </div>
            </div>
          ) : null}
          {orientMsg ? (
            <p
              className="mt-2 text-xs text-ink/45"
              style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
            >
              {orientMsg}
            </p>
          ) : null}

          <div className="mt-6" role="tablist" aria-label={t("visuals.tablistLabel")}>
            <div className="-mx-1 flex gap-1 overflow-x-auto pb-2 pt-1 [scrollbar-width:thin]">
              {pdfs.map((p, i) => {
                const selected = i === active;
                const label = vocabPdfTitle(p, locale);
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={`visuals-panel-${p.id}`}
                    id={`visuals-tab-${p.id}`}
                    onClick={() => setActive(i)}
                    className={
                      selected
                        ? "shrink-0 rounded-full border px-3 py-2 text-sm font-medium text-white transition-colors"
                        : "shrink-0 rounded-full border border-ink/15 bg-paper px-3 py-2 text-sm font-medium text-ink/70 transition-colors hover:border-ink/25 hover:bg-ink/[0.03]"
                    }
                    style={
                      selected
                        ? {
                            backgroundColor: "var(--accent)",
                            borderColor: "var(--accent)",
                            fontFamily: "ui-sans-serif, system-ui, sans-serif",
                          }
                        : { fontFamily: "ui-sans-serif, system-ui, sans-serif" }
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {row ? (
            <div
              role="tabpanel"
              id={`visuals-panel-${row.id}`}
              aria-labelledby={`visuals-tab-${row.id}`}
              className="mt-2"
            >
              <VisualPdfPager
                key={row.file}
                pdfUrl={withPublicBasePath(`/downloads/${row.file}`)}
                title={`${t("visuals.iframeTitle")}: ${vocabPdfTitle(row, locale)}`}
                t={t}
              />
              {desc ? (
                <p className="mt-4 max-w-prose text-sm leading-relaxed text-ink/55">{desc}</p>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}
