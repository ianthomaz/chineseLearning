"use client";

import { useLocale } from "@/context/LocaleContext";

export function AppFooter() {
  const { t } = useLocale();
  return (
    <footer className="mx-auto max-w-6xl border-t border-ink/10 px-5 py-10 text-center text-xs text-ink/45">
      {t("footer.phraseFont")}{" "}
      <a
        href="https://github.com/parlr/hanzi-pinyin-font"
        className="text-accent underline decoration-accent/25 underline-offset-2"
        target="_blank"
        rel="noreferrer"
      >
        {t("footer.phraseFontLink")}
      </a>
      . {t("footer.rest")} {t("footer.license")}
    </footer>
  );
}
