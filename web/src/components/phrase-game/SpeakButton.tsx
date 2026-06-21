"use client";

import { useEffect, useState } from "react";
import { hasChineseVoice, isSpeechSupported, speakChinese } from "@/lib/phrase-game/speech";

/**
 * 🔊 button that speaks a Chinese string aloud. Renders nothing when the device
 * has no Chinese voice (so it never shows a button that would do nothing).
 */
export function SpeakButton({ text, label }: { text: string; label: string }) {
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

  return (
    <button
      type="button"
      onClick={() => speakChinese(text)}
      aria-label={label}
      title={label}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm leading-none transition-colors hover:bg-ink/5 active:scale-95"
      style={{ borderColor: "var(--border)" }}
    >
      🔊
    </button>
  );
}
