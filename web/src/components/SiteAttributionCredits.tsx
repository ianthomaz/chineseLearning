"use client";

import { useLocale } from "@/context/LocaleContext";

/** Font (rubi) + Hanzi Writer stroke data — same text as the global site footer. */
export function SiteAttributionCredits({ className }: { className?: string }) {
  const { t } = useLocale();
  return (
    <div
      className={`text-center text-xs leading-relaxed text-ink/45 ${className ?? ""}`.trim()}
    >
      <p>
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
      </p>
      <p className="mt-3">
        {t("footer.hanziWriterIntro")}{" "}
        <a
          href="https://github.com/chanind/hanzi-writer"
          className="text-accent underline decoration-accent/25 underline-offset-2"
          target="_blank"
          rel="noreferrer"
        >
          {t("footer.hanziWriterLib")}
        </a>{" "}
        {t("footer.hanziWriterMid")}{" "}
        <a
          href="https://github.com/chanind/hanzi-writer-data"
          className="text-accent underline decoration-accent/25 underline-offset-2"
          target="_blank"
          rel="noreferrer"
        >
          {t("footer.hanziWriterData")}
        </a>{" "}
        {t("footer.hanziWriterTail")}{" "}
        <a
          href="https://github.com/skishore/makemeahanzi"
          className="text-accent underline decoration-accent/25 underline-offset-2"
          target="_blank"
          rel="noreferrer"
        >
          {t("footer.hanziWriterMmh")}
        </a>
        {t("footer.hanziWriterEnd")}
      </p>
    </div>
  );
}
