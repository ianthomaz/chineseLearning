"use client";

import Link from "next/link";
import { useConsent } from "@/context/ConsentContext";
import { useLocale } from "@/context/LocaleContext";

export function CookieBanner() {
  const { bannerVisible, setChoice, closeBanner } = useConsent();
  const { t } = useLocale();

  if (!bannerVisible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-paper/98 p-4 shadow-lg backdrop-blur-sm sm:p-5"
      style={{
        borderColor: "var(--border)",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
      }}
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2
            id="cookie-banner-title"
            className="text-sm font-semibold text-ink"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {t("legal.cookieBannerTitle")}
          </h2>
          <p
            id="cookie-banner-desc"
            className="mt-1.5 text-sm leading-relaxed text-ink/65"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {t("legal.cookieBannerBody")}{" "}
            <Link href="/privacy" className="text-accent underline underline-offset-2">
              {t("legal.privacyLink")}
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setChoice("essential")}
            className="rounded-full border px-4 py-2.5 text-sm font-medium text-ink/75 transition-colors hover:bg-ink/5"
            style={{ borderColor: "var(--border)", fontFamily: "var(--font-sans)" }}
          >
            {t("legal.cookieRejectAnalytics")}
          </button>
          <button
            type="button"
            onClick={() => setChoice("analytics")}
            className="rounded-full px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:brightness-95"
            style={{ backgroundColor: "var(--accent)", fontFamily: "var(--font-sans)" }}
          >
            {t("legal.cookieAcceptAnalytics")}
          </button>
          <button
            type="button"
            onClick={closeBanner}
            className="sr-only sm:not-sr-only sm:rounded-full sm:px-2 sm:py-2.5 sm:text-xs sm:text-ink/45"
          >
            {t("legal.cookieDismiss")}
          </button>
        </div>
      </div>
    </div>
  );
}
