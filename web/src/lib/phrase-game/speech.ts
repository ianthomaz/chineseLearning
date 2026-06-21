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
  return window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("zh"));
}

export function hasChineseVoice(): boolean {
  return zhVoices().length > 0;
}

/** Prefer a Mainland Mandarin (zh-CN) voice, else any Chinese voice. */
function pickVoice(): SpeechSynthesisVoice | null {
  const zh = zhVoices();
  if (zh.length === 0) return null;
  return (
    zh.find((v) => /zh[-_]?cn/i.test(v.lang)) ??
    zh.find((v) => /(mandarin|putonghua|普通话|中文)/i.test(v.name)) ??
    zh[0]
  );
}

/** Speak a Chinese string, slightly slowed for learners. Cancels any ongoing speech. */
export function speakChinese(text: string): void {
  if (!isSpeechSupported() || !text.trim()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 0.85;
  const voice = pickVoice();
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
}
