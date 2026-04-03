"use client";

import { useEffect, useId, useState } from "react";
import { useLocale } from "@/context/LocaleContext";
import { usePinyin } from "@/context/PinyinContext";
import { useTranslationDisplay } from "@/context/TranslationContext";

export function EdgeSettingsDrawer() {
  const { t } = useLocale();
  const { showPinyin, setShowPinyin } = usePinyin();
  const { showTranslation, setShowTranslation } = useTranslationDisplay();
  const [open, setOpen] = useState(false);
  const tabId = useId();
  const panelId = `${tabId}-panel`;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function rowSwitch(
    label: string,
    description: string,
    on: boolean,
    setOn: (v: boolean) => void,
  ) {
    return (
      <div className="flex items-start justify-between gap-3 border-b border-ink/10 py-3 last:border-0">
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-medium text-ink/85"
            style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
          >
            {label}
          </p>
          <p
            className="mt-0.5 text-xs leading-snug text-ink/45"
            style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
          >
            {description}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          onClick={() => setOn(!on)}
          className="relative h-7 w-12 shrink-0 rounded-full transition-colors"
          style={{
            backgroundColor: on ? "var(--accent)" : "rgba(28,25,23,0.15)",
          }}
        >
          <span
            className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform"
            style={{
              left: on ? "calc(100% - 1.625rem)" : "0.125rem",
            }}
          />
        </button>
      </div>
    );
  }

  return (
    <>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-[90] cursor-default bg-ink/25 backdrop-blur-[1px]"
          aria-label={t("settings.closeBackdrop")}
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div
        className="pointer-events-none fixed right-0 top-1/2 z-[100] flex -translate-y-1/2 flex-row items-stretch"
        style={{ maxHeight: "min(90vh, 32rem)" }}
      >
        {open ? (
          <div
            id={panelId}
            role="region"
            aria-label={t("settings.panelTitle")}
            className="pointer-events-auto w-[min(18rem,calc(100vw-2.75rem))] overflow-y-auto rounded-l-xl border border-r-0 bg-paper shadow-xl"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="p-4 pt-5">
              <h2
                className="mb-1 text-lg font-medium text-ink"
                style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
              >
                {t("settings.panelTitle")}
              </h2>
              <p
                className="mb-2 text-xs text-ink/45"
                style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
              >
                {t("settings.panelHint")}
              </p>
              <div className="-mx-1">
                {rowSwitch(
                  t("settings.pinyinLabel"),
                  t("settings.pinyinDesc"),
                  showPinyin,
                  setShowPinyin,
                )}
                {rowSwitch(
                  t("settings.translationLabel"),
                  t("settings.translationDesc"),
                  showTranslation,
                  setShowTranslation,
                )}
              </div>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          id={tabId}
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          onClick={() => setOpen((o) => !o)}
          className="pointer-events-auto flex w-10 shrink-0 flex-col items-center justify-center gap-1 rounded-l-lg border border-r-0 bg-paper py-3 shadow-md transition-colors hover:bg-ink/[0.04]"
          style={{
            borderColor: "var(--border)",
            boxShadow: open ? "0 0 0 2px var(--accent)" : undefined,
          }}
          title={open ? t("settings.collapseTab") : t("settings.expandTab")}
        >
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/55"
            style={{
              writingMode: "vertical-rl",
              textOrientation: "mixed",
              fontFamily: "ui-sans-serif, system-ui, sans-serif",
            }}
          >
            {t("settings.tab")}
          </span>
          <span className="font-hanzi text-sm text-accent" aria-hidden>
            读
          </span>
        </button>
      </div>
    </>
  );
}
