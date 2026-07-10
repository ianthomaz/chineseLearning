"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/context/LocaleContext";
import { trackEvent } from "@/lib/analytics";
import { buildRound, type Round } from "@/lib/phrase-game/select-phrases";
import { clampDisplaySettingsForLevel } from "@/lib/phrase-game/settings-by-level";
import { localizedPrompt } from "@/lib/phrase-game/display";
import { logGameEvent, newRoundId } from "@/lib/phrase-game/game-log";
import {
  DEFAULT_DISPLAY_SETTINGS,
  type DisplaySettings,
  type GameLevel,
  type GameTier,
  type Phrase,
} from "@/lib/phrase-game/types";
import { AuthPanel } from "./AuthPanel";
import { GameplayScreen } from "./GameplayScreen";
import { SetupScreen } from "./SetupScreen";
import { SpeakButton } from "./SpeakButton";

type Phase = "setup" | "playing" | "complete";

export function PhraseGame({ phrases }: { phrases: Phrase[] }) {
  const bank = phrases;
  const { t } = useLocale();
  const [phase, setPhase] = useState<Phase>("setup");
  const [tier, setTier] = useState<GameTier>("iniciante");
  const [level, setLevel] = useState<GameLevel>(1);
  const [settings, setSettings] = useState<DisplaySettings>(DEFAULT_DISPLAY_SETTINGS);
  const [round, setRound] = useState<Round | null>(null);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Array<"correct" | "wrong" | null>>([]);

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
      setPhase("setup");
      return;
    }
    const built = buildRound(bank, { tier, level, settings });
    if (built.items.length === 0) return;
    const roundId = newRoundId();
    roundIdRef.current = roundId;
    abandonedRef.current = false;
    setRound(built);
    setIndex(0);
    setResults(new Array(built.items.length).fill(null));
    setPhase("playing");
    trackEvent({ action: "round_start", category: "phrase_game", label: `${tier}/L${level}` });
    logGameEvent("round_start", { roundId, tier, level });
  }

  function handleResult(correct: boolean) {
    setResults((prev) => {
      const next = [...prev];
      next[index] = correct ? "correct" : "wrong";
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
    trackEvent({ action: "round_complete", category: "phrase_game", value: correct });
    logGameEvent("round_complete", {
      roundId: roundIdRef.current,
      tier,
      level,
      detail: `${correct}/${results.length}`,
    });
  }, [phase, results, tier, level]);

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

  // Tier change resets an invalid level (Iniciante caps to 1-2).
  function handleTierChange(next: GameTier) {
    setTier(next);
    if (next === "iniciante" && level > 2) {
      const capped: GameLevel = 2;
      setLevel(capped);
      setSettings((s) => clampDisplaySettingsForLevel(capped, s));
    }
  }

  function handleLevelChange(next: GameLevel) {
    setLevel(next);
    setSettings((s) => clampDisplaySettingsForLevel(next, s));
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pb-24 pt-6 sm:px-6">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium text-ink sm:text-3xl">
            {t("phraseGame.title")}
          </h1>
          <p className="mt-1 text-sm text-ink/55">{t("phraseGame.subtitle")}</p>
        </div>
      </header>

      <div
        role="status"
        className="mb-4 rounded-2xl border px-4 py-3 text-sm text-ink/75"
        style={{ borderColor: "var(--border)", backgroundColor: "rgba(45,90,140,0.06)" }}
      >
        {t("phraseGame.prototypeNotice")}
      </div>

      <AuthPanel />

      <div className="mt-6">
        {phase === "setup" ? (
          <>
            {bank.length === 0 ? (
              <p className="mb-4 text-sm text-danger">
                Banco de frases vazio — corre <code>npm run seed:content</code> no servidor.
              </p>
            ) : null}
            <SetupScreen
              tier={tier}
              level={level}
              settings={settings}
              onTierChange={handleTierChange}
              onLevelChange={handleLevelChange}
              onSettingsChange={setSettings}
              onPlay={startRound}
            />
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
            items={round.items.map((it, i) => ({
              phrase: it.phrase,
              correct: results[i] === "correct",
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
  items,
  onPlayAgain,
  onChangeSettings,
}: {
  correct: number;
  total: number;
  items: Array<{ phrase: Phrase; correct: boolean }>;
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

      {/* All phrases from the round, in order — wrong ones flagged, each with audio. */}
      <div className="mt-6 text-left">
        <p className="mb-3 text-sm font-semibold text-ink">
          {t("phraseGame.roundComplete.allPhrasesTitle")}
        </p>
        <ul className="space-y-2.5">
          {items.map(({ phrase: p, correct: ok }, i) => (
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
