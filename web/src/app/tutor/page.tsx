"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "@/context/LocaleContext";
import { useTranslationDisplay } from "@/context/TranslationContext";
import { ChineseWithPinyinLine } from "@/components/ChineseWithPinyinLine";

type Message = {
  role: "user" | "assistant";
  text: string;
  structured?: Array<{
    hanzi: string;
    pinyin: string;
    translation: Record<string, string>;
  }>;
};

export default function TutorPage() {
  const { t, locale } = useLocale();
  const { showTranslation } = useTranslationDisplay();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          history: messages.map((m) => ({
            role: m.role,
            content: m.text,
          })),
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      const assistantMessage: Message = {
        role: "assistant",
        text: data.reply,
        structured: data.structured,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
      setError("Erro ao falar com o professor. Verifique a API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex h-[calc(100vh-80px)] max-w-3xl flex-col px-6 pb-6 pt-10">
      <div className="mb-6">
        <p
          className="mb-2 text-xs font-medium uppercase tracking-widest text-ink/35"
          style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
        >
          {t("tutor.kicker") || "AI Tutor"}
        </p>
        <h1 className="font-display text-3xl font-medium text-ink md:text-4xl">
          {t("tutor.pageTitle") || "Conversa com o Professor"}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink/55">
          {t("tutor.pageIntro") || "Pratique o seu chinês com o nosso professor de inteligência artificial. Ele responderá sempre em chinês para ajudar no seu aprendizado."}
        </p>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-2xl border bg-paper p-4 shadow-inner"
        style={{ borderColor: "var(--border)" }}
      >
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-center text-sm text-ink/30 italic">
            Comece a conversa escrevendo algo abaixo em Português ou Chinês.
          </div>
        )}
        <div className="flex flex-col gap-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-accent/10 text-ink border border-accent/20"
                    : "bg-ink/5 text-ink border border-ink/10"
                }`}
              >
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink/30">
                  {msg.role === "user" ? t("tutor.roleUser") || "VOCÊ" : t("tutor.roleAssistant") || "PROFESSOR"}
                </span>

                {msg.role === "assistant" && msg.structured ? (
                  <div className="flex flex-col gap-3 mt-2">
                    {msg.structured.map((line, lIdx) => (
                      <div key={lIdx} className="flex flex-col gap-1">
                        <ChineseWithPinyinLine
                          hanzi={line.hanzi}
                          pinyin={line.pinyin}
                          hanziClassName="font-hanzi text-lg leading-relaxed text-ink"
                        />
                        {showTranslation && (
                          <p className="text-xs leading-snug text-ink/50 italic">
                            {line.translation[locale] || line.translation["pt"]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-ink/5 rounded-2xl px-4 py-3 animate-pulse text-xs text-ink/40">
                O professor está digitando...
              </div>
            </div>
          )}
          {error && (
            <div className="text-center text-xs text-red-500 bg-red-50 py-2 rounded-lg border border-red-100">
              {error}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escreva algo em português ou chinês..."
          disabled={loading}
          className="flex-1 rounded-xl border bg-paper px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
          style={{ borderColor: "var(--border)" }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-accent px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {t("tutor.send") || "Enviar"}
        </button>
      </form>
    </main>
  );
}
