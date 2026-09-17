"use client";

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { trackEvent } from "@/lib/analytics";

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
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {t("crossLinks.prefix")}
        </span>
      ) : null}
      {items.map((key) => (
        <Link
          key={key}
          href={`/${key}/${id}`}
          onClick={() =>
            trackEvent({
              action: "study_mode_switch",
              category: "study",
              label: `${current}->${key}`,
              block_id: blockId,
              from: current,
              to: key,
              path: `/${key}/${id}`,
            })
          }
          className="flex min-h-[44px] items-center gap-1.5 rounded-full border px-3 text-xs transition-colors hover:bg-ink/5"
          style={{
            borderColor: "var(--border)",
            fontFamily: "var(--font-sans)",
            color: "color-mix(in srgb, var(--ink) 60%, transparent)",
          }}
        >
          <span className="font-hanzi text-sm">{hanzi[key]}</span>
          {t(`nav.${key}`)}
        </Link>
      ))}
    </aside>
  );
}
