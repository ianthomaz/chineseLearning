"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { localeMeta, locales, useLocale } from "@/context/LocaleContext";

export function SiteNav() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useLocale();
  const [langOpen, setLangOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setLangOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const closeMenu = useCallback(() => setLangOpen(false), []);

  return (
    <header className="border-b bg-paper" style={{ borderColor: "var(--border)" }}>
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="font-display text-xl font-medium tracking-tight text-ink transition-colors hover:text-accent"
        >
          漢語 <span className="font-light text-ink/40">· {t("metadata.siteTitle")}</span>
        </Link>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setLangOpen((o) => !o)}
              className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-ink/5"
              style={{
                borderColor: "var(--border)",
                fontFamily: "ui-sans-serif, system-ui, sans-serif",
                color: "rgba(28,25,23,0.65)",
              }}
              aria-expanded={langOpen}
              aria-haspopup="listbox"
              title={t("nav.language")}
            >
              <span>{localeMeta(locale).flag}</span>
              <span>{localeMeta(locale).langName}</span>
              <span className="text-ink/35" aria-hidden>
                ▾
              </span>
            </button>
            {langOpen ? (
              <ul
                className="absolute right-0 z-50 mt-1 min-w-[10rem] rounded-xl border bg-paper py-1 shadow-md"
                style={{ borderColor: "var(--border)" }}
                role="listbox"
              >
                {locales.map((loc) => (
                  <li key={loc}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={loc === locale}
                      onClick={() => {
                        setLocale(loc);
                        closeMenu();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-ink/5"
                      style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
                    >
                      <span>{localeMeta(loc).flag}</span>
                      {localeMeta(loc).langName}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <nav className="flex gap-1" aria-label={t("nav.courseNav")}>
            {(
              [
                { href: "/review", key: "review" as const },
                { href: "/vocabulary", key: "vocabulary" as const },
                { href: "/grammar", key: "grammar" as const },
                { href: "/dialogues", key: "dialogues" as const },
              ] as const
            ).map((tab) => {
              const isActive =
                pathname === tab.href || pathname.startsWith(`${tab.href}/`);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={
                    isActive
                      ? "rounded-full px-4 py-1.5 text-sm font-medium text-white transition-colors"
                      : "rounded-full px-4 py-1.5 text-sm text-ink/55 transition-colors hover:bg-ink/5 hover:text-ink"
                  }
                  style={isActive ? { backgroundColor: "var(--accent)" } : {}}
                >
                  {t(`nav.${tab.key}`)}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
