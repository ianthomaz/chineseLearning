"use client";

import { useEffect, useState } from "react";
import { hasChineseVoice, isSpeechSupported, speakChinese } from "@/lib/phrase-game/speech";

/**
 * Button that speaks a Chinese string aloud (Web Speech API). Renders nothing
 * when the device has no Chinese voice, so it never shows a dead control.
 *
 * `variant="icon"` (default) is a compact 🔊 circle; `variant="pill"` is a
 * labelled pill matching the in-round help buttons.
 */
export function SpeakButton({
  text,
  label,
  variant = "icon",
  onPlay,
}: {
  text: string;
  label: string;
  variant?: "icon" | "pill";
  onPlay?: () => void;
}) {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (!isSpeechSupported()) return;
    const update = () => setAvailable(hasChineseVoice());
    update(); // voices may already be loaded
    const synth = window.speechSynthesis;
    synth.addEventListener?.("voiceschanged", update); // …or arrive asynchronously
    return () => synth.removeEventListener?.("voiceschanged", update);
  }, []);

  if (!available) return null;

  const handleClick = () => {
    onPlay?.();
    speakChinese(text);
  };

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="rounded-full border px-3 py-1.5 text-xs text-ink/65 transition-colors hover:bg-ink/5"
        style={{ borderColor: "var(--border)", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
      >
        🔊 {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      title={label}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm leading-none transition-colors hover:bg-ink/5 active:scale-95"
      style={{ borderColor: "var(--border)" }}
    >
      🔊
    </button>
  );
}
