"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { localeMeta, locales, useLocale } from "@/context/LocaleContext";
import { SiteNavAuth } from "@/components/SiteNavAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Icon } from "@/components/ui/Icon";
import { hidesSiteNav } from "@/lib/immersive-routes";
import { isAdminEmail } from "@/lib/phrase-game/admin";
import { trackEvent } from "@/lib/analytics";

const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED !== "0";

type NavTab = {
  href: string;
  key: string;
};

const NAV_LINK_INACTIVE_CLASS =
  "flex min-h-[44px] items-center rounded-full px-3 text-sm text-ink/55 transition-colors hover:bg-ink/5 hover:text-ink";

const NAV_LINK_ACTIVE_CLASS =
  "flex min-h-[44px] items-center rounded-full px-3 text-sm font-medium text-white transition-colors";

/**
 * Primary bar: phrase game + quiz. Everything else lives in the overflow menu
 * so desktop stays scannable (Phrases · Quiz · Sign in · ☰).
 */
const PRIMARY_NAV_TABS: readonly NavTab[] = [
  { href: "/phrase-game", key: "phraseGame" },
  { href: "/gamification", key: "gamification" },
];

const NAV_GROUPS: ReadonlyArray<{ key: "play" | "study"; tabs: readonly NavTab[] }> = [
  {
    key: "play",
    tabs: [
      { href: "/practice", key: "tutor" },
      { href: "/ktv", key: "ktv" },
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

const OVERFLOW_TABS: readonly NavTab[] = NAV_GROUPS.flatMap((g) => g.tabs);

/** Paths that keep the Prática tab highlighted (hub + sub-flows). */
function isPracticePath(pathname: string): boolean {
  return (
    pathname === "/practice" ||
    pathname.startsWith("/practice/") ||
    pathname === "/tutor" ||
    pathname.startsWith("/tutor/")
  );
}

function isTabActive(tab: NavTab, pathname: string): boolean {
  if (tab.href === "/practice") return isPracticePath(pathname);
  return pathname === tab.href || pathname.startsWith(`${tab.href}/`);
}

const CURATOR_TABS: readonly NavTab[] = [
  { href: "/registerClass", key: "registerClass" },
  { href: "/reviewClass", key: "reviewClass" },
];

type Variant = "desktop" | "mobile";

/** Shared tab styling so desktop and mobile stay in step. */
function tabClassName(variant: Variant, active: boolean): string {
  if (variant === "desktop") {
    return active ? NAV_LINK_ACTIVE_CLASS : NAV_LINK_INACTIVE_CLASS;
  }
  if (active) return "rounded-xl px-4 py-3.5 text-base font-medium text-white";
  return "rounded-xl px-4 py-3.5 text-base text-ink/75 transition-colors hover:bg-ink/5";
}

function tabStyle(active: boolean): React.CSSProperties {
  const base = { fontFamily: "var(--font-sans)" };
  if (active) return { ...base, backgroundColor: "var(--accent)" };
  return base;
}

function NavTabLink({
  tab,
  pathname,
  variant,
  t,
  onNavigate,
}: {
  tab: NavTab;
  pathname: string;
  variant: Variant;
  t: (key: string) => string;
  onNavigate?: () => void;
}) {
  const active = isTabActive(tab, pathname);
  return (
    <Link
      href={tab.href}
      onClick={() => {
        trackEvent({
          action: "nav_click",
          category: "navigation",
          label: tab.key,
          path: tab.href,
        });
        onNavigate?.();
      }}
      className={tabClassName(variant, active)}
      style={tabStyle(active)}
    >
      {t(`nav.${tab.key}`)}
    </Link>
  );
}

function CuratorTabs({
  pathname,
  variant,
  t,
  onNavigate,
}: {
  pathname: string;
  variant: Variant;
  t: (key: string) => string;
  onNavigate?: () => void;
}) {
  const { data: session } = useSession();
  if (!isAdminEmail(session?.user?.email)) return null;

  return (
    <div className={variant === "mobile" ? "flex flex-col gap-1" : "flex flex-col gap-1"}>
      <p
        className="px-4 pb-1 pt-2 text-[0.7rem] font-semibold uppercase tracking-widest text-ink/35"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {t("nav.group.curator")}
      </p>
      {CURATOR_TABS.map((tab) => {
        const active = isTabActive(tab, pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            onClick={onNavigate}
            className={
              variant === "desktop"
                ? active
                  ? "rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors"
                  : "rounded-xl px-4 py-2.5 text-sm text-accent transition-colors hover:bg-ink/5"
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

function NavOverflowPanel({
  pathname,
  locale,
  t,
  setLocale,
  onClose,
  variant,
  panelRef,
}: {
  pathname: string;
  locale: ReturnType<typeof useLocale>["locale"];
  t: (key: string) => string;
  setLocale: (loc: ReturnType<typeof useLocale>["locale"]) => void;
  onClose: () => void;
  variant: "sheet" | "dropdown";
  panelRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const panelClass =
    variant === "sheet"
      ? "max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border md:hidden"
      : "absolute right-0 z-50 mt-2 hidden max-h-[min(32rem,calc(100dvh-5rem))] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border bg-paper py-2 shadow-lg md:block";

  return (
    <div
      ref={panelRef}
      id={variant === "sheet" ? "site-overflow-nav-sheet" : "site-overflow-nav-menu"}
      className={panelClass}
      style={{ borderColor: "var(--border)" }}
    >
      <nav
        className={
          variant === "sheet"
            ? "mx-auto flex max-w-6xl flex-col gap-4 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:px-6"
            : "flex flex-col gap-3 px-2 py-1"
        }
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
                onNavigate={onClose}
              />
            ))}
          </div>
        ))}

        {AUTH_ENABLED ? (
          <CuratorTabs pathname={pathname} variant="mobile" t={t} onNavigate={onClose} />
        ) : null}

        <div
          className="mx-2 mt-1 flex flex-col gap-2 border-t pt-3"
          style={{ borderColor: "var(--border)" }}
        >
          <p
            className="px-2 pb-0.5 text-[0.7rem] font-semibold uppercase tracking-widest text-ink/35"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {t("nav.group.settings")}
          </p>
          <div className="flex items-center justify-between gap-2 px-2">
            <span className="text-sm text-ink/65" style={{ fontFamily: "var(--font-sans)" }}>
              {t("nav.appearance")}
            </span>
            <ThemeToggle />
          </div>
          <div className="px-2">
            <p
              className="mb-1.5 text-sm text-ink/65"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {t("nav.language")}
            </p>
            <ul className="flex flex-col gap-0.5" role="listbox">
              {locales.map((loc) => (
                <li key={loc}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={loc === locale}
                    onClick={() => {
                      setLocale(loc);
                      onClose();
                    }}
                    className="flex min-h-[44px] w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-ink/5"
                    style={{
                      fontFamily: "var(--font-sans)",
                      backgroundColor:
                        loc === locale
                          ? "color-mix(in srgb, var(--accent) 10%, transparent)"
                          : undefined,
                    }}
                  >
                    <span>{localeMeta(loc).flag}</span>
                    {localeMeta(loc).langName}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>
    </div>
  );
}

export function SiteNav() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useLocale();
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowAnchorRef = useRef<HTMLDivElement>(null);
  const overflowSheetRef = useRef<HTMLDivElement>(null);
  const overflowButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      const inside =
        overflowAnchorRef.current?.contains(target) ||
        overflowSheetRef.current?.contains(target) ||
        overflowButtonRef.current?.contains(target);
      if (!inside) setOverflowOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    setOverflowOpen(false);
  }, [pathname]);

  const closeOverflow = useCallback(() => setOverflowOpen(false), []);

  if (hidesSiteNav(pathname)) return null;

  const overflowActive = OVERFLOW_TABS.some((tab) => isTabActive(tab, pathname));

  return (
    <header
      className="sticky top-0 z-40 border-b bg-paper/95 backdrop-blur-sm supports-[backdrop-filter]:bg-paper/80"
      style={{ borderColor: "var(--border)", paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4">
        <Link
          href="/"
          className="flex min-h-[44px] min-w-0 shrink items-center font-display text-base font-medium tracking-tight text-ink transition-colors hover:text-accent sm:min-w-[5rem] sm:text-xl"
        >
          <span className="line-clamp-2 leading-snug">
            漢語 <span className="font-light text-ink/40">· {t("metadata.siteTitle")}</span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <nav
            className="flex items-center gap-0.5 sm:gap-1"
            aria-label={t("nav.primaryNav")}
          >
            {PRIMARY_NAV_TABS.map((tab) => (
              <NavTabLink
                key={tab.href}
                tab={tab}
                pathname={pathname}
                variant="desktop"
                t={t}
              />
            ))}
          </nav>

          <SiteNavAuth />

          <div className="relative" ref={overflowAnchorRef}>
            <button
              ref={overflowButtonRef}
              type="button"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border transition-colors hover:bg-ink/5"
              style={{
                borderColor: overflowActive ? "var(--accent)" : "var(--border)",
                color: overflowActive ? "var(--accent)" : "color-mix(in srgb, var(--ink) 70%, transparent)",
                backgroundColor: overflowActive
                  ? "color-mix(in srgb, var(--accent) 8%, transparent)"
                  : undefined,
              }}
              aria-expanded={overflowOpen}
              aria-controls="site-overflow-nav-menu site-overflow-nav-sheet"
              onClick={() => setOverflowOpen((o) => !o)}
            >
              <span className="sr-only">{t("nav.courseNav")}</span>
              <Icon name={overflowOpen ? "close" : "menu"} size="1.2em" />
            </button>

            {overflowOpen ? (
              <NavOverflowPanel
                pathname={pathname}
                locale={locale}
                t={t}
                setLocale={setLocale}
                onClose={closeOverflow}
                variant="dropdown"
              />
            ) : null}
          </div>
        </div>
      </div>

      {overflowOpen ? (
        <NavOverflowPanel
          pathname={pathname}
          locale={locale}
          t={t}
          setLocale={setLocale}
          onClose={closeOverflow}
          variant="sheet"
          panelRef={overflowSheetRef}
        />
      ) : null}
    </header>
  );
}
