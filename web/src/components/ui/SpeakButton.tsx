"use client";

import { useEffect, useState } from "react";
import { MaterialIcon } from "@/components/phrase-game/MaterialIcon";
import { hasChineseVoice, isSpeechSupported, speakChinese, speechTextFromWords } from "@/lib/phrase-game/speech";

/**
 * Button that speaks a Chinese string aloud (Web Speech API). Renders nothing
 * when the device has no Chinese voice, so it never shows a dead control.
 */
export function SpeakButton({
  text,
  words,
  label,
  variant = "icon",
  onPlay,
}: {
  /** Full sentence (used when `words` is omitted). */
  text: string;
  /** Prefer word pieces — spoken with light pauses between them. */
  words?: readonly string[];
  label: string;
  variant?: "icon" | "active";
  onPlay?: () => void;
}) {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (!isSpeechSupported()) return;
    const update = () => setAvailable(hasChineseVoice());
    update();
    const synth = window.speechSynthesis;
    synth.addEventListener?.("voiceschanged", update);
    return () => synth.removeEventListener?.("voiceschanged", update);
  }, []);

  if (!available) return null;

  const handleClick = () => {
    onPlay?.();
    const spoken =
      words && words.length > 0 ? speechTextFromWords(words) : text;
    speakChinese(spoken);
  };

  if (variant === "active") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={label}
        title={label}
        className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl border-2 px-3.5 py-2 text-sm font-semibold transition-colors hover:opacity-90 active:scale-[0.98]"
        style={{
          borderColor: "var(--accent)",
          color: "var(--accent)",
          backgroundColor: "rgba(45,90,140,0.08)",
          fontFamily: "var(--font-sans)",
        }}
      >
        <MaterialIcon name="volume_up" className="text-xl" filled />
        {/* Label hidden on narrow screens — icon + aria-label already say enough. */}
        <span className="hidden sm:inline">{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      title={label}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors hover:bg-ink/5 active:scale-95"
      style={{ borderColor: "var(--border)", color: "var(--accent)" }}
    >
      <MaterialIcon name="volume_up" className="text-base" />
    </button>
  );
}
