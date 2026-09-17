"use client";

import Link from "next/link";
import { requestCookieBanner } from "@/context/ConsentContext";
import { useLocale } from "@/context/LocaleContext";

export function SiteLegalLinks() {
  const { t } = useLocale();

  return (
    <nav
      className="mb-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-ink/70"
      aria-label={t("legal.footerNavLabel")}
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <Link
        href="/privacy"
        className="font-medium underline decoration-ink/20 underline-offset-2 transition-colors hover:text-accent hover:decoration-accent/40"
      >
        {t("legal.privacyLink")}
      </Link>
      <span className="text-ink/25" aria-hidden>
        ·
      </span>
      <Link
        href="/terms"
        className="font-medium underline decoration-ink/20 underline-offset-2 transition-colors hover:text-accent hover:decoration-accent/40"
      >
        {t("legal.termsLink")}
      </Link>
      <span className="text-ink/25" aria-hidden>
        ·
      </span>
      <button
        type="button"
        onClick={requestCookieBanner}
        className="font-medium underline decoration-ink/20 underline-offset-2 transition-colors hover:text-accent hover:decoration-accent/40"
      >
        {t("legal.cookieSettings")}
      </button>
    </nav>
  );
}
