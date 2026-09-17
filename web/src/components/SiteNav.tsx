"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { localeMeta, locales, useLocale } from "@/context/LocaleContext";
import { SiteNavAuth } from "@/components/SiteNavAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Icon } from "@/components/ui/Icon";
import { isAdminEmail } from "@/lib/phrase-game/admin";

const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED !== "0";

type NavTab = {
  href: string;
  key: string;
  /** Renders as a call to action rather than a plain tab. */
  featured?: boolean;
};

/**
 * Two groups, in this order everywhere: interactive things first, reference
 * material second. Eight flat tabs read as one undifferentiated list on a phone,
 * and the phrase game — the thing we most want people to open — sat in the middle.
 */
const NAV_GROUPS: ReadonlyArray<{ key: "play" | "study"; tabs: readonly NavTab[] }> = [
  {
    key: "play",
    tabs: [
      { href: "/phrase-game", key: "phraseGame", featured: true },
      { href: "/gamification", key: "gamification" },
      { href: "/praticar", key: "tutor" },
    ],
  },
  {
    key: "study",
    tabs: [
      { href: "/review", key: "review" },
      { href: "/vocabulary", key: "vocabulary" },
      { href: "/visuals", key: "visuals" },
      { href: "/grammar", key: "grammar" },
      { href: "/dialogues", key: "dialogues" },
    ],
  },
];

const NAV_TABS: readonly NavTab[] = NAV_GROUPS.flatMap((g) => g.tabs);

/** Paths that keep the Prática tab highlighted (hub + sub-flows). */
function isPracticePath(pathname: string): boolean {
  return (
    pathname === "/praticar" ||
    pathname.startsWith("/praticar/") ||
    pathname === "/tutor" ||
    pathname.startsWith("/tutor/") ||
    pathname === "/randomhanzi" ||
    pathname.startsWith("/randomhanzi/")
  );
}

function isTabActive(tab: NavTab, pathname: string): boolean {
  if (tab.href === "/praticar") return isPracticePath(pathname);
  return pathname === tab.href || pathname.startsWith(`${tab.href}/`);
}

const CURATOR_TABS: readonly NavTab[] = [
  { href: "/registerClass", key: "registerClass" },
  { href: "/reviewClass", key: "reviewClass" },
];

type Variant = "desktop" | "mobile";

/** Shared tab styling so desktop and mobile stay in step. */
function tabClassName(variant: Variant, active: boolean, featured = false): string {
  if (variant === "desktop") {
    if (active) return "rounded-full px-3 py-2 text-sm font-medium text-white transition-colors";
    if (featured)
      return "rounded-full px-3 py-2 text-sm font-semibold transition-colors hover:brightness-95";
    return "rounded-full px-3 py-2 text-sm text-ink/55 transition-colors hover:bg-ink/5 hover:text-ink";
  }
  if (active) return "rounded-xl px-4 py-3.5 text-base font-medium text-white";
  if (featured) return "rounded-xl px-4 py-3.5 text-base font-semibold";
  return "rounded-xl px-4 py-3.5 text-base text-ink/75 transition-colors hover:bg-ink/5";
}

function tabStyle(active: boolean, featured = false): React.CSSProperties {
  const base = { fontFamily: "var(--font-sans)" };
  if (active) return { ...base, backgroundColor: "var(--accent)" };
  if (featured)
    return {
      ...base,
      color: "var(--cat-violet)",
      backgroundColor: "color-mix(in srgb, var(--cat-violet) 12%, transparent)",
    };
  return base;
}

function NavTabLink({
  tab,
  pathname,
  variant,
  t,
}: {
  tab: NavTab;
  pathname: string;
  variant: Variant;
  t: (key: string) => string;
}) {
  const active = isTabActive(tab, pathname);
  return (
    <Link
      href={tab.href}
      className={tabClassName(variant, active, tab.featured)}
      style={tabStyle(active, tab.featured)}
    >
      {tab.featured && !active ? <span className="mr-1.5 font-hanzi">拼</span> : null}
      {t(`nav.${tab.key}`)}
    </Link>
  );
}

/**
 * Curator-only nav links. Only mounted when AUTH_ENABLED (so useSession has a
 * provider) and rendered only for the curator email — invisible to everyone
 * else and to the static export.
 */
function CuratorTabs({
  pathname,
  variant,
  t,
}: {
  pathname: string;
  variant: Variant;
  t: (key: string) => string;
}) {
  const { data: session } = useSession();
  if (!isAdminEmail(session?.user?.email)) return null;

  return (
    <div className={variant === "mobile" ? "flex flex-col gap-1" : "contents"}>
      {CURATOR_TABS.map((tab) => {
        const active = isTabActive(tab, pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={
              variant === "desktop"
                ? active
                  ? "rounded-full px-3 py-2 text-sm font-medium text-white transition-colors"
                  : "rounded-full px-3 py-2 text-sm text-accent transition-colors hover:bg-ink/5"
                : active
                  ? "rounded-xl px-4 py-3.5 text-base font-medium text-white"
                  : "rounded-xl px-4 py-3.5 text-base text-accent transition-colors hover:bg-ink/5"
            }
            style={
              active
                ? { backgroundColor: "var(--accent)", fontFamily: "var(--font-sans)" }
                : { fontFamily: "var(--font-sans)" }
            }
          >
            {t(`nav.${tab.key}`)}
          </Link>
        );
      })}
    </div>
  );
}

function isKtvPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === "/ktv" || pathname.endsWith("/ktv");
}

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

  if (isKtvPath(pathname)) return null;

  return (
    <header
      className="sticky top-0 z-40 border-b bg-paper/95 backdrop-blur-sm supports-[backdrop-filter]:bg-paper/80"
      style={{ borderColor: "var(--border)", paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link
          href="/"
          className="flex min-h-[44px] min-w-[5rem] shrink items-center font-display text-lg font-medium tracking-tight text-ink transition-colors hover:text-accent sm:text-xl"
        >
          <span className="line-clamp-2 leading-snug">
            漢語 <span className="font-light text-ink/40">· {t("metadata.siteTitle")}</span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <SiteNavAuth />
          <ThemeToggle />
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setLangOpen((o) => !o)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-full border px-3 text-xs font-medium transition-colors hover:bg-ink/5 sm:min-w-0 sm:py-1.5"
              style={{
                borderColor: "var(--border)",
                fontFamily: "var(--font-sans)",
                color: "color-mix(in srgb, var(--ink) 65%, transparent)",
              }}
              aria-expanded={langOpen}
              aria-haspopup="listbox"
              title={t("nav.language")}
            >
              <span className="text-base">{localeMeta(locale).flag}</span>
              <span className="hidden sm:inline">{localeMeta(locale).langName}</span>
              <Icon name="chevronDown" size="0.9em" className="text-ink/35" />
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
                      style={{ fontFamily: "var(--font-sans)" }}
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
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border text-ink/70 transition-colors hover:bg-ink/5 xl:hidden"
            aria-expanded={mobileNavOpen}
            aria-controls="site-mobile-nav"
            onClick={() => setMobileNavOpen((o) => !o)}
          >
            <span className="sr-only">{t("nav.courseNav")}</span>
            <Icon name={mobileNavOpen ? "close" : "menu"} size="1.2em" />
          </button>

          <nav
            className="hidden flex-wrap items-center justify-end gap-1 xl:flex"
            aria-label={t("nav.courseNav")}
          >
            {NAV_TABS.map((tab) => (
              <NavTabLink
                key={tab.href}
                tab={tab}
                pathname={pathname}
                variant="desktop"
                t={t}
              />
            ))}
            {AUTH_ENABLED && <CuratorTabs pathname={pathname} variant="desktop" t={t} />}
          </nav>
        </div>
      </div>

      {mobileNavOpen ? (
        <div
          id="site-mobile-nav"
          ref={mobileNavRef}
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border xl:hidden"
          style={{ borderColor: "var(--border)" }}
        >
          <nav
            className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:px-6"
            aria-label={t("nav.courseNav")}
          >
            {NAV_GROUPS.map((group) => (
              <div key={group.key} className="flex flex-col gap-1">
                <p
                  className="px-4 pb-1 text-[0.7rem] font-semibold uppercase tracking-widest text-ink/35"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {t(`nav.group.${group.key}`)}
                </p>
                {group.tabs.map((tab) => (
                  <NavTabLink
                    key={tab.href}
                    tab={tab}
                    pathname={pathname}
                    variant="mobile"
                    t={t}
                  />
                ))}
              </div>
            ))}
            {AUTH_ENABLED && <CuratorTabs pathname={pathname} variant="mobile" t={t} />}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
