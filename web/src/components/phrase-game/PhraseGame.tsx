"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/context/LocaleContext";
import type { AppLocale } from "@/lib/i18n-core";
import { trackEvent } from "@/lib/analytics";
import { buildRound, type Round } from "@/lib/phrase-game/select-phrases";
import { clampLevelToPool } from "@/lib/phrase-game/settings-by-level";
import { localizedPrompt } from "@/lib/phrase-game/display";
import { logGameEvent, newRoundId } from "@/lib/phrase-game/game-log";
import { usePhraseBank } from "@/lib/phrase-game/use-phrase-bank";
import { applyPreset, GAME_PRESETS, type GamePreset } from "@/lib/phrase-game/presets";
import { recordFinishedRound, usePlayerProgress } from "@/lib/game-progress";
import { roundScore } from "@/lib/phrase-game/scoring";
import {
  PHRASE_POOLS,
  type DisplaySettings,
  type GameLevel,
  type GameTier,
  type Phrase,
} from "@/lib/phrase-game/types";
import { PlayerProgressCard } from "@/components/PlayerProgressCard";
import { AuthPanel } from "./AuthPanel";
import { GameplayScreen } from "./GameplayScreen";
import { SetupScreen } from "./SetupScreen";
import { SpeakButton } from "@/components/ui/SpeakButton";

type Phase = "setup" | "playing" | "complete";

/** BCP 47 tags for number formatting; the UI locale codes are bare languages. */
const LOCALE_TAG: Record<AppLocale, string> = {
  pt: "pt-BR",
  en: "en-US",
  es: "es-ES",
};

const INITIAL_PRESET = GAME_PRESETS[0];

export function PhraseGame({ initialPhrases }: { initialPhrases: Phrase[] | null }) {
  const { bank, status: bankStatus } = usePhraseBank(initialPhrases);
  const progress = usePlayerProgress();
  const { t } = useLocale();
  const [phase, setPhase] = useState<Phase>("setup");
  // Open on the gentlest preset rather than on a bare default, so the setup
  // screen starts in a state the player can recognise and just press Play.
  // The vocabulary is its own choice — a preset never sets it.
  const [tier, setTier] = useState<GameTier>(PHRASE_POOLS[0]);
  const [level, setLevel] = useState<GameLevel>(INITIAL_PRESET.level);
  const [settings, setSettings] = useState<DisplaySettings>(INITIAL_PRESET.settings);
  const [round, setRound] = useState<Round | null>(null);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Array<"correct" | "wrong" | null>>([]);
  /** Weighted points per phrase, same indexing as `results`. */
  const [scores, setScores] = useState<number[]>([]);
  // A round that builds to nothing used to leave Play doing nothing at all,
  // which is indistinguishable from a broken button. Surface it instead.
  const [noRound, setNoRound] = useState(false);

  const roundIdRef = useRef("");
  const abandonedRef = useRef(false);
  // Mirror the live round state so the mount-only abandon listener can read the
  // latest values without re-subscribing every render.
  const liveRef = useRef({ playing: false, completed: false, tier, level, total: 0, index: 0 });
  liveRef.current = {
    playing: phase === "playing",
    completed: phase === "complete",
    tier,
    level,
    total: round?.items.length ?? 0,
    index,
  };

  function startRound() {
    if (bank.length === 0) {
      setNoRound(true);
      setPhase("setup");
      return;
    }
    const built = buildRound(bank, { tier, level, settings });
    if (built.items.length === 0) {
      setNoRound(true);
      return;
    }
    setNoRound(false);
    const roundId = newRoundId();
    roundIdRef.current = roundId;
    abandonedRef.current = false;
    setRound(built);
    setIndex(0);
    setResults(new Array(built.items.length).fill(null));
    setScores(new Array(built.items.length).fill(0));
    setPhase("playing");
    trackEvent({ action: "round_start", category: "phrase_game", label: `${tier}/L${level}` });
    logGameEvent("round_start", { roundId, tier, level });
  }

  function handleResult(correct: boolean, score: number) {
    setResults((prev) => {
      const next = [...prev];
      next[index] = correct ? "correct" : "wrong";
      return next;
    });
    setScores((prev) => {
      const next = [...prev];
      next[index] = score;
      return next;
    });
  }

  function handleNext() {
    if (!round) return;
    if (index < round.items.length - 1) {
      setIndex((i) => i + 1);
    } else {
      setPhase("complete");
    }
  }

  // Report the round score once results are final — reading them here (rather
  // than inside the click handler) avoids counting a stale results array.
  useEffect(() => {
    if (phase !== "complete") return;
    const correct = results.filter((r) => r === "correct").length;
    const points = roundScore(scores);
    trackEvent({ action: "round_complete", category: "phrase_game", value: correct });
    logGameEvent("round_complete", {
      roundId: roundIdRef.current,
      tier,
      level,
      detail: `${correct}/${results.length} · ${points}pts`,
    });

    // Persist for signed-in players; a guest gets a 401 and keeps only the
    // anonId event log. `reload` refreshes the setup screen behind this one.
    const items = round?.items ?? [];
    if (items.length > 0) {
      recordFinishedRound({
        game: "phrase",
        roundId: roundIdRef.current,
        tier,
        level,
        items: items.map((it, i) => ({
          itemId: it.phrase.id,
          correct: results[i] === "correct",
          score: scores[i] ?? 0,
        })),
      });
      progress.reload();
    }
    // `round` and `progress.reload` are stable for the life of a finished round.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, results, scores, tier, level]);

  // Entries: log that the game was opened, once per mount.
  useEffect(() => {
    logGameEvent("game_enter");
  }, []);

  // Abandons: log if the player leaves mid-round (SPA navigation/unmount or tab close).
  useEffect(() => {
    const maybeAbandon = () => {
      const s = liveRef.current;
      if (abandonedRef.current || !s.playing || s.completed || !roundIdRef.current) return;
      abandonedRef.current = true;
      logGameEvent("round_abandon", {
        roundId: roundIdRef.current,
        tier: s.tier,
        level: s.level,
        detail: `reached:${s.index + 1}/${s.total}`,
      });
    };
    window.addEventListener("pagehide", maybeAbandon);
    return () => {
      window.removeEventListener("pagehide", maybeAbandon);
      maybeAbandon();
    };
  }, []);

  /** A preset sets all three axes at once — that is the point of it. */
  function handlePresetChange(preset: GamePreset) {
    // The chosen vocabulary stays put and sets the ceiling: Challenge on HSK 1
    // is the hardest round HSK 1 can produce, not a jump to another pool.
    const applied = applyPreset(preset, tier);
    setLevel(applied.level);
    setSettings(applied.settings);
  }

  /** A smaller pool can lower the level; it never touches the hints. */
  function handleTierChange(next: GameTier) {
    setTier(next);
    setLevel((current) => clampLevelToPool(next, current));
  }

  function handleLevelChange(next: GameLevel) {
    setLevel(next);
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6 sm:px-6">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium text-ink sm:text-3xl">
            {t("phraseGame.title")}
          </h1>
          <p className="mt-1 text-sm text-ink/55">{t("phraseGame.subtitle")}</p>
        </div>
      </header>

      {/* The game is the first thing on the page; signing in — which is optional —
          sits below the setup screen. Rounds are kept for signed-in players, so
          this says what the player actually gets rather than "nothing is saved". */}
      <div className="mb-4">
        <PlayerProgressCard
          game="phrase"
          summary={progress.data?.phrase ?? null}
          recentRounds={progress.data?.recentRounds}
          signedIn={progress.data !== null}
          loaded={progress.loaded}
        />
      </div>

      <div>
        {phase === "setup" ? (
          <>
            {bankStatus === "error" ? (
              <p className="mb-4 text-sm text-danger">{t("phraseGame.bankError")}</p>
            ) : null}
            {noRound && bankStatus !== "error" ? (
              <p className="mb-4 text-sm text-danger" role="alert">
                {t("phraseGame.noRound")}
              </p>
            ) : null}
            <label
              className="mb-6 block"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              <span className="mb-1.5 block text-sm font-semibold text-ink">
                {t("phraseGame.tierLabel")}
              </span>
              <select
                value={tier}
                onChange={(e) => handleTierChange(e.target.value as GameTier)}
                className="min-h-[44px] w-full rounded-xl border bg-transparent px-3 py-2.5 text-sm text-ink"
                style={{ borderColor: "var(--border)" }}
              >
                {PHRASE_POOLS.map((id) => (
                  <option key={id} value={id}>
                    {t(`phraseGame.tier.${id}`)}
                  </option>
                ))}
              </select>
            </label>
            <SetupScreen
              tier={tier}
              level={level}
              settings={settings}
              bankLoading={bankStatus === "loading"}
              hsk1Knowledge={tier === "hsk1"}
              onPresetChange={handlePresetChange}
              onLevelChange={handleLevelChange}
              onSettingsChange={setSettings}
              onPlay={startRound}
            />
            {/* Anchor target for the header "Entrar" link, which lands here. */}
            <div id="phrase-game-auth" className="mt-8 scroll-mt-24">
              <AuthPanel />
            </div>
          </>
        ) : null}

        {phase === "playing" && round ? (
          <GameplayScreen
            key={index}
            item={round.items[index]}
            tier={tier}
            roundId={roundIdRef.current}
            level={level}
            settings={settings}
            index={index}
            total={round.items.length}
            results={results}
            isLast={index === round.items.length - 1}
            onSettingsChange={setSettings}
            onResult={handleResult}
            onNext={handleNext}
          />
        ) : null}

        {phase === "complete" && round ? (
          <RoundComplete
            correct={results.filter((r) => r === "correct").length}
            total={round.items.length}
            points={roundScore(scores)}
            items={round.items.map((it, i) => ({
              phrase: it.phrase,
              correct: results[i] === "correct",
              score: scores[i] ?? 0,
            }))}
            onPlayAgain={startRound}
            onChangeSettings={() => setPhase("setup")}
          />
        ) : null}
      </div>
    </main>
  );
}

function RoundComplete({
  correct,
  total,
  points,
  items,
  onPlayAgain,
  onChangeSettings,
}: {
  correct: number;
  total: number;
  /** Weighted round total — see docs/06_jogo_frases.md. */
  points: number;
  items: Array<{ phrase: Phrase; correct: boolean; score: number }>;
  onPlayAgain: () => void;
  onChangeSettings: () => void;
}) {
  const { t, locale } = useLocale();
  return (
    <div className="rounded-2xl border p-6 text-center" style={{ borderColor: "var(--border)" }}>
      <p className="font-display text-2xl font-medium text-ink">{t("phraseGame.roundComplete.title")}</p>
      <p className="mt-2 text-ink/70">
        {t("phraseGame.roundComplete.score", { correct, total })}
      </p>
      <p
        className="mt-3 text-3xl font-semibold text-ink"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {t("phraseGame.roundComplete.points", { points: formatPoints(points, locale), total })}
      </p>
      <p className="mt-1 text-xs text-ink/45" style={{ fontFamily: "var(--font-sans)" }}>
        {t("phraseGame.roundComplete.pointsHint")}
      </p>

      {/* All phrases from the round, in order — wrong ones flagged, each with audio. */}
      <div className="mt-6 text-left">
        <p className="mb-3 text-sm font-semibold text-ink">
          {t("phraseGame.roundComplete.allPhrasesTitle")}
        </p>
        <ul className="space-y-2.5">
          {items.map(({ phrase: p, correct: ok, score }, i) => (
            <li
              key={`${p.id}-${i}`}
              className="flex items-start gap-3 rounded-xl border p-3"
              style={{
                borderColor: ok ? "var(--border)" : "#fca5a5",
                backgroundColor: ok ? "transparent" : "rgba(185,28,28,0.05)",
              }}
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-semibold text-white"
                style={{ backgroundColor: ok ? "#15803d" : "#b91c1c" }}
                title={ok ? t("phraseGame.correct") : t("phraseGame.wrong")}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-hanzi text-lg leading-snug text-ink">{p.hanzi}</span>
                  <SpeakButton text={p.hanzi} label={t("phraseGame.speak")} />
                </div>
                {p.pinyin ? (
                  <p
                    className="text-sm text-ink/55"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {p.pinyin}
                  </p>
                ) : null}
                <p className="mt-0.5 text-sm text-ink/70">{localizedPrompt(p, locale)}</p>
              </div>
              <span
                className="shrink-0 text-sm font-semibold tabular-nums"
                style={{
                  fontFamily: "var(--font-sans)",
                  color: score >= 1 ? "var(--success)" : score > 0 ? "var(--warn)" : "var(--ink)",
                  opacity: score > 0 ? 1 : 0.35,
                }}
                title={t("phraseGame.roundComplete.pointsHint")}
              >
                {formatPoints(score, locale)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onPlayAgain}
          className="rounded-xl px-6 py-3 text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          {t("phraseGame.roundComplete.playAgain")}
        </button>
        <button
          type="button"
          onClick={onChangeSettings}
          className="rounded-xl border px-6 py-3 text-sm font-medium text-ink/70 hover:bg-ink/5"
          style={{ borderColor: "var(--border)" }}
        >
          {t("phraseGame.roundComplete.changeSettings")}
        </button>
      </div>
    </div>
  );
}

/**
 * Up to two decimals with the locale's own separator — "1,39" in pt/es, "1.39"
 * in en — and no trailing zeros, so a clean score reads "1" and not "1,00".
 */
function formatPoints(value: number, locale: AppLocale): string {
  return new Intl.NumberFormat(LOCALE_TAG[locale], {
    maximumFractionDigits: 2,
  }).format(value);
}
