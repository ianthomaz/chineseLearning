/**
 * Chinese text-to-speech via the browser's built-in Web Speech API
 * (`speechSynthesis`). No backend, no library — the device synthesizes Mandarin.
 *
 * Degrades to a no-op where it is unsupported or no Chinese voice is installed
 * (callers use {@link hasChineseVoice} to hide the trigger).
 */

export function isSpeechSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof SpeechSynthesisUtterance !== "undefined"
  );
}

function zhVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSupported()) return [];
  return window.speechSynthesis.getVoices().filter((v) => {
    const lang = v.lang.toLowerCase();
    const name = v.name.toLowerCase();
    if (!lang.startsWith("zh") && !lang.startsWith("cmn")) return false;
    // Skip Cantonese / Yue — Mandarin only for this site.
    if (
      lang.includes("hk") ||
      lang.includes("yue") ||
      name.includes("cantonese") ||
      name.includes("粤") ||
      name.includes("廣東") ||
      name.includes("广东")
    ) {
      return false;
    }
    return true;
  });
}

export function hasChineseVoice(): boolean {
  return zhVoices().length > 0;
}

function voiceScore(v: SpeechSynthesisVoice): number {
  const lang = v.lang.toLowerCase();
  const name = v.name.toLowerCase();
  let score = 0;
  if (/zh[-_]?cn/.test(lang) || lang.startsWith("cmn")) score += 12;
  if (name.includes("google")) score += 10;
  if (name.includes("enhanced") || name.includes("premium") || name.includes("neural")) score += 8;
  if (name.includes("ting") || name.includes("meijia") || name.includes("普通话") || name.includes("putonghua")) {
    score += 5;
  }
  // Cloud voices are often clearer than older local ones on macOS/Windows.
  if (v.localService === false) score += 3;
  return score;
}

/** Prefer clear Mainland Mandarin voices; never Cantonese. */
function pickVoice(): SpeechSynthesisVoice | null {
  const zh = zhVoices();
  if (zh.length === 0) return null;
  return [...zh].sort((a, b) => voiceScore(b) - voiceScore(a))[0] ?? null;
}

/**
 * Learner pace: slower than the browser default (1.0).
 * Kept conservative — Chrome sometimes ignores values that are too low.
 */
export const PHRASE_GAME_SPEECH_RATE = 0.55;

/** Ideographic comma — many Chinese voices pause briefly on it. */
const WORD_PAUSE = "，";

/** Join word pieces so TTS can breathe between them. */
export function speechTextFromWords(words: readonly string[]): string {
  return words.map((w) => w.trim()).filter(Boolean).join(WORD_PAUSE);
}

/** Speak a Chinese string, slowed for learners. Cancels any ongoing speech. */
export function speakChinese(text: string): void {
  if (!isSpeechSupported() || !text.trim()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  // Chrome can leave the queue paused after cancel; resume so the next speak runs.
  try {
    synth.resume();
  } catch {
    /* ignore */
  }

  const utterance = new SpeechSynthesisUtterance(text.trim());
  utterance.lang = "zh-CN";
  utterance.rate = PHRASE_GAME_SPEECH_RATE;
  utterance.pitch = 1;
  const voice = pickVoice();
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang || "zh-CN";
  }

  // Tiny delay after cancel so the engine does not clip the first syllable.
  window.setTimeout(() => {
    try {
      synth.resume();
    } catch {
      /* ignore */
    }
    synth.speak(utterance);
  }, 50);
}
