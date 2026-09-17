"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { trackEvent } from "@/lib/analytics";

/** essential = necessary cookies only; analytics = GA + anon game telemetry grouping */
export type ConsentChoice = "unset" | "essential" | "analytics";

const STORAGE_KEY = "consent.v1";
const CONSENT_EVENT = "learnchinese:consent-change";
const OPEN_BANNER_EVENT = "learnchinese:open-cookie-banner";

type ConsentContextValue = {
  choice: ConsentChoice;
  bannerVisible: boolean;
  setChoice: (choice: Exclude<ConsentChoice, "unset">) => void;
  openBanner: () => void;
  closeBanner: () => void;
  analyticsAllowed: boolean;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

function readStored(): ConsentChoice {
  if (typeof window === "undefined") return "unset";
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "essential" || v === "analytics") return v;
  } catch {
    /* ignore */
  }
  return "unset";
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [choice, setChoiceState] = useState<ConsentChoice>("unset");
  const [bannerVisible, setBannerVisible] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStored();
    setChoiceState(stored);
    setBannerVisible(stored === "unset");
    setReady(true);
  }, []);

  const persist = useCallback((next: Exclude<ConsentChoice, "unset">) => {
    setChoiceState(next);
    setBannerVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: next }));
    trackEvent({
      action: "consent_choice",
      category: "consent",
      label: next,
    });
  }, []);

  const openBanner = useCallback(() => setBannerVisible(true), []);
  const closeBanner = useCallback(() => setBannerVisible(false), []);

  useEffect(() => {
    const onOpen = () => setBannerVisible(true);
    window.addEventListener(OPEN_BANNER_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_BANNER_EVENT, onOpen);
  }, []);

  const value = useMemo(
    () => ({
      choice: ready ? choice : "unset",
      bannerVisible: ready && bannerVisible,
      setChoice: persist,
      openBanner,
      closeBanner,
      analyticsAllowed: choice === "analytics",
    }),
    [ready, choice, bannerVisible, persist, openBanner, closeBanner],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error("useConsent must be used within ConsentProvider");
  }
  return ctx;
}

/** Open cookie banner from footer without importing the full context tree in SSR. */
export function requestCookieBanner(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OPEN_BANNER_EVENT));
  }
}

export function onConsentChange(handler: (choice: ConsentChoice) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const fn = (e: Event) => {
    const detail = (e as CustomEvent<ConsentChoice>).detail;
    if (detail) handler(detail);
  };
  window.addEventListener(CONSENT_EVENT, fn);
  return () => window.removeEventListener(CONSENT_EVENT, fn);
}

export function getConsentChoiceSync(): ConsentChoice {
  return readStored();
}
