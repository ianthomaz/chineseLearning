"use client";

import { useLocale } from "@/context/LocaleContext";

export function AppFooter() {
  const { t } = useLocale();
  return (
    <footer className="mx-auto max-w-6xl border-t border-ink/10 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom,0px))] text-center text-xs leading-relaxed text-ink/45 sm:px-5 sm:py-10">
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
