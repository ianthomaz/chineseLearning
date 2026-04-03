"use client";

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";

type Props = {
  blockId: number;
  current: "review" | "vocabulary" | "grammar";
  /** `top`: below block title, before review content. `bottom`: after main content, before pager. */
  placement?: "top" | "bottom";
};

const modeKeys = ["review", "vocabulary", "grammar"] as const;

const hanzi: Record<(typeof modeKeys)[number], string> = {
  review: "复习",
  vocabulary: "词汇",
  grammar: "语法",
};

export function CrossLinks({ blockId, current, placement = "bottom" }: Props) {
  const { t } = useLocale();
  const id = String(blockId);
  const items = modeKeys.filter((k) => k !== current);

  const boxClass =
    placement === "top"
      ? "mb-10 flex flex-wrap items-center gap-2 border-b pb-8"
      : "mt-10 flex flex-wrap items-center gap-2 border-t pt-8";

  return (
    <aside
      className={boxClass}
      style={{ borderColor: "var(--border)" }}
      aria-label={t("crossLinks.aria")}
    >
      {placement === "bottom" ? (
        <span
          className="mr-1 text-xs text-ink/35"
          style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
        >
          {t("crossLinks.prefix")}
        </span>
      ) : null}
      {items.map((key) => (
        <Link
          key={key}
          href={`/${key}/${id}`}
          className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors hover:bg-ink/5"
          style={{
            borderColor: "var(--border)",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
            color: "rgba(28,25,23,0.6)",
          }}
        >
          <span className="font-hanzi text-sm">{hanzi[key]}</span>
          {t(`nav.${key}`)}
        </Link>
      ))}
    </aside>
  );
}
