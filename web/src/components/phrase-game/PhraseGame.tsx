"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/context/LocaleContext";
import { trackEvent } from "@/lib/analytics";
import { ALL_PHRASES } from "@/lib/phrase-game/phrases";
import { buildRound, type Round } from "@/lib/phrase-game/select-phrases";
import {
  DEFAULT_DISPLAY_SETTINGS,
  type DisplaySettings,
  type GameLevel,
  type GameTier,
} from "@/lib/phrase-game/types";
import { AuthPanel } from "./AuthPanel";
import { GameplayScreen } from "./GameplayScreen";
import { SetupScreen } from "./SetupScreen";

type Phase = "setup" | "playing" | "complete";

export function PhraseGame() {
  const { t } = useLocale();
  const [phase, setPhase] = useState<Phase>("setup");
  const [tier, setTier] = useState<GameTier>("iniciante");
  const [level, setLevel] = useState<GameLevel>(1);
  const [settings, setSettings] = useState<DisplaySettings>(DEFAULT_DISPLAY_SETTINGS);
  const [round, setRound] = useState<Round | null>(null);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Array<"correct" | "wrong" | null>>([]);

  function startRound() {
    const built = buildRound(ALL_PHRASES, { tier, level, settings });
    setRound(built);
    setIndex(0);
    setResults(new Array(built.items.length).fill(null));
    setPhase("playing");
    trackEvent({ action: "round_start", category: "phrase_game", label: `${tier}/L${level}` });
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
  }, [phase, results]);

  // Tier change resets an invalid level (Iniciante caps to 1-2).
  function handleTierChange(next: GameTier) {
    setTier(next);
    if (next === "iniciante" && level > 2) setLevel(2);
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

      <AuthPanel />

      <div className="mt-6">
        {phase === "setup" ? (
          <SetupScreen
            tier={tier}
            level={level}
            settings={settings}
            onTierChange={handleTierChange}
            onLevelChange={setLevel}
            onSettingsChange={setSettings}
            onPlay={startRound}
          />
        ) : null}

        {phase === "playing" && round ? (
          <GameplayScreen
            key={index}
            item={round.items[index]}
            level={level}
            settings={settings}
            index={index}
            total={round.items.length}
            results={results}
            isLast={index === round.items.length - 1}
            onResult={handleResult}
            onNext={handleNext}
          />
        ) : null}

        {phase === "complete" && round ? (
          <RoundComplete
            correct={results.filter((r) => r === "correct").length}
            total={round.items.length}
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
  onPlayAgain,
  onChangeSettings,
}: {
  correct: number;
  total: number;
  onPlayAgain: () => void;
  onChangeSettings: () => void;
}) {
  const { t } = useLocale();
  return (
    <div className="rounded-2xl border p-6 text-center" style={{ borderColor: "var(--border)" }}>
      <p className="font-display text-2xl font-medium text-ink">{t("phraseGame.roundComplete.title")}</p>
      <p className="mt-2 text-ink/70">
        {t("phraseGame.roundComplete.score", { correct, total })}
      </p>
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
