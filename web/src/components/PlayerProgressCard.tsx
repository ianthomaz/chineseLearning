"use client";

import { useLocale } from "@/context/LocaleContext";
import type { AppLocale } from "@/lib/i18n-core";
import type { GameKind, GameSummary, RoundRow } from "@/lib/game-progress";

/** BCP 47 tags for number formatting; the UI locale codes are bare languages. */
const LOCALE_TAG: Record<AppLocale, string> = {
  pt: "pt-BR",
  en: "en-US",
  es: "es-ES",
};

function formatPoints(value: number, locale: AppLocale): string {
  return new Intl.NumberFormat(LOCALE_TAG[locale], { maximumFractionDigits: 2 }).format(value);
}

type Props = {
  game: GameKind;
  summary: GameSummary | null;
  /** All recent rounds; the card picks the latest one for this game. */
  recentRounds?: RoundRow[];
  /** Null while the request is in flight, so nothing flashes. */
  signedIn: boolean;
  loaded: boolean;
};

/**
 * What a signed-in player has built up, above the setup screen.
 *
 * Guests see the reason to sign in instead of a progress panel: the score is
 * real either way, it just is not kept. Nothing here renders until the progress
 * request settles, so the card never flips from "guest" to "signed in".
 */
export function PlayerProgressCard({ game, summary, recentRounds, signedIn, loaded }: Props) {
  const { t, locale } = useLocale();
  if (!loaded) return null;

  if (!signedIn) {
    return (
      <p
        role="status"
        className="text-xs leading-relaxed text-ink/45"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {t("gameProgress.guest")}
      </p>
    );
  }

  const last = recentRounds?.find((r) => r.game === game) ?? null;
  const hasHistory = (summary?.rounds ?? 0) > 0;

  if (!hasHistory) {
    return (
      <p
        role="status"
        className="text-xs leading-relaxed text-ink/45"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {t("gameProgress.firstRound")}
      </p>
    );
  }

  const toReview = summary?.itemsToReview ?? 0;

  return (
    <div
      className="rounded-xl border px-4 py-3"
      style={{ borderColor: "var(--border)" }}
      role="status"
    >
      <dl className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
        {last ? (
          <Stat
            label={t("gameProgress.lastRound")}
            value={`${last.correct}/${last.total}`}
            hint={
              last.points > 0
                ? t("gameProgress.points", { points: formatPoints(last.points, locale) })
                : undefined
            }
          />
        ) : null}
        <Stat
          label={t("gameProgress.rounds")}
          value={String(summary?.rounds ?? 0)}
        />
        {(summary?.bestPoints ?? 0) > 0 ? (
          <Stat
            label={t("gameProgress.best")}
            value={formatPoints(summary?.bestPoints ?? 0, locale)}
          />
        ) : null}
      </dl>

      {toReview > 0 ? (
        <p
          className="mt-2.5 text-xs font-medium"
          style={{ color: "var(--warn)", fontFamily: "var(--font-sans)" }}
        >
          {toReview === 1
            ? t("gameProgress.toReviewOne")
            : t("gameProgress.toReview", { count: toReview })}
        </p>
      ) : null}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <dt
        className="text-[0.65rem] uppercase tracking-wide text-ink/40"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {label}
      </dt>
      <dd
        className="text-base font-semibold tabular-nums text-ink"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {value}
        {hint ? <span className="ml-1.5 text-xs font-normal text-ink/50">{hint}</span> : null}
      </dd>
    </div>
  );
}
