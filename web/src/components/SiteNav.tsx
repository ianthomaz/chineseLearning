"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePinyin } from "@/context/PinyinContext";

const tabs = [
  { href: "/review", label: "Revisão", prefix: "/review" },
  { href: "/vocabulary", label: "Vocabulário", prefix: "/vocabulary" },
  { href: "/grammar", label: "Gramática", prefix: "/grammar" },
] as const;

export function SiteNav() {
  const pathname = usePathname();
  const { showPinyin, togglePinyin } = usePinyin();

  return (
    <header className="border-b bg-paper" style={{ borderColor: "var(--border)" }}>
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="font-display text-xl font-medium tracking-tight text-ink transition-colors hover:text-accent"
        >
          漢語 <span className="font-light text-ink/40">· Chinês básico</span>
        </Link>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={togglePinyin}
            className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-ink/5"
            style={{
              borderColor: "var(--border)",
              fontFamily: "ui-sans-serif, system-ui, sans-serif",
              color: showPinyin ? "var(--accent)" : "rgba(28,25,23,0.55)",
            }}
            aria-pressed={showPinyin}
            title="Alternar coluna pinyin e fonte com ruby nas frases"
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: showPinyin
                  ? "var(--accent)"
                  : "rgba(28,25,23,0.25)",
              }}
            />
            {showPinyin ? "Com pinyin" : "Sem pinyin"}
          </button>

          <nav className="flex gap-1" aria-label="Áreas do curso">
            {tabs.map((t) => {
              const isActive =
                pathname === t.prefix || pathname.startsWith(`${t.prefix}/`);
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={
                    isActive
                      ? "rounded-full px-4 py-1.5 text-sm font-medium text-white transition-colors"
                      : "rounded-full px-4 py-1.5 text-sm text-ink/55 transition-colors hover:bg-ink/5 hover:text-ink"
                  }
                  style={isActive ? { backgroundColor: "var(--accent)" } : {}}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
