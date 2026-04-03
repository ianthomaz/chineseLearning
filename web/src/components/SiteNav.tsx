"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { localeMeta, locales, useLocale } from "@/context/LocaleContext";

const NAV_TABS = [
  { href: "/review", key: "review" as const },
  { href: "/vocabulary", key: "vocabulary" as const },
  { href: "/grammar", key: "grammar" as const },
  { href: "/dialogues", key: "dialogues" as const },
  { href: "/tutor", key: "tutor" as const },
] as const;

export function SiteNav() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useLocale();
  const [langOpen, setLangOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t)) setLangOpen(false);
      if (
        mobileNavRef.current &&
        !mobileNavRef.current.contains(t) &&
        !mobileMenuButtonRef.current?.contains(t)
      ) {
        setMobileNavOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const closeMenu = useCallback(() => setLangOpen(false), []);

  return (
    <header
      className="sticky top-0 z-40 border-b bg-paper/95 backdrop-blur-sm supports-[backdrop-filter]:bg-paper/80"
      style={{ borderColor: "var(--border)", paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link
          href="/"
          className="flex min-h-[44px] min-w-0 shrink-0 items-center font-display text-lg font-medium tracking-tight text-ink transition-colors hover:text-accent sm:text-xl"
        >
          <span className="line-clamp-2 leading-snug">
            漢語 <span className="font-light text-ink/40">· {t("metadata.siteTitle")}</span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setLangOpen((o) => !o)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-full border px-3 text-xs font-medium transition-colors hover:bg-ink/5 sm:min-w-0 sm:py-1.5"
              style={{
                borderColor: "var(--border)",
                fontFamily: "ui-sans-serif, system-ui, sans-serif",
                color: "rgba(28,25,23,0.65)",
              }}
              aria-expanded={langOpen}
              aria-haspopup="listbox"
              title={t("nav.language")}
            >
              <span className="text-base">{localeMeta(locale).flag}</span>
              <span className="hidden sm:inline">{localeMeta(locale).langName}</span>
              <span className="text-ink/35 sm:inline" aria-hidden>
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
                      className="flex min-h-[44px] w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-ink/5"
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

          <button
            ref={mobileMenuButtonRef}
            type="button"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border text-ink/70 transition-colors hover:bg-ink/5 lg:hidden"
            style={{ borderColor: "var(--border)", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
            aria-expanded={mobileNavOpen}
            aria-controls="site-mobile-nav"
            onClick={() => setMobileNavOpen((o) => !o)}
          >
            <span className="sr-only">{t("nav.courseNav")}</span>
            <span aria-hidden className="text-lg leading-none">
              {mobileNavOpen ? "✕" : "☰"}
            </span>
          </button>

          <nav
            className="hidden flex-wrap items-center justify-end gap-1 lg:flex"
            aria-label={t("nav.courseNav")}
          >
            {NAV_TABS.map((tab) => {
              const isActive =
                pathname === tab.href || pathname.startsWith(`${tab.href}/`);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={
                    isActive
                      ? "rounded-full px-4 py-2 text-sm font-medium text-white transition-colors"
                      : "rounded-full px-4 py-2 text-sm text-ink/55 transition-colors hover:bg-ink/5 hover:text-ink"
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

      {mobileNavOpen ? (
        <div
          id="site-mobile-nav"
          ref={mobileNavRef}
          className="border-t lg:hidden"
          style={{ borderColor: "var(--border)" }}
        >
          <nav
            className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-3 sm:px-6"
            aria-label={t("nav.courseNav")}
          >
            {NAV_TABS.map((tab) => {
              const isActive =
                pathname === tab.href || pathname.startsWith(`${tab.href}/`);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={
                    isActive
                      ? "rounded-xl px-4 py-3.5 text-base font-medium text-white"
                      : "rounded-xl px-4 py-3.5 text-base text-ink/75 transition-colors hover:bg-ink/5"
                  }
                  style={
                    isActive
                      ? { backgroundColor: "var(--accent)", fontFamily: "ui-sans-serif, system-ui, sans-serif" }
                      : { fontFamily: "ui-sans-serif, system-ui, sans-serif" }
                  }
                >
                  {t(`nav.${tab.key}`)}
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
