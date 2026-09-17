import { getConsentChoiceSync } from "@/context/ConsentContext";

export type AnalyticsCategory =
  | "navigation"
  | "phrase_game"
  | "quiz"
  | "ktv"
  | "study"
  | "vocab"
  | "auth"
  | "settings"
  | "modal"
  | "writing_game"
  | "tutor"
  | "consent"
  | "home"
  | "practice";

/** Params forwarded to GA4 as custom event parameters. */
export type AnalyticsParams = {
  action: string;
  category?: AnalyticsCategory;
  label?: string;
  value?: number;
  locale?: string;
  block_id?: number | string;
  question_type?: string;
  correct?: boolean;
  score?: number;
  total?: number;
  path?: string;
  mode?: string;
  provider?: string;
  from?: string;
  to?: string;
  hanzi?: string;
  song?: string;
  deck_id?: string;
  pdf_id?: string;
  /** 0 | 1 for GA4 compatibility when needed */
  success?: 0 | 1;
};

export type AnalyticsEvent = AnalyticsParams;

function analyticsAllowed(): boolean {
  if (typeof window === "undefined") return false;
  return getConsentChoiceSync() === "analytics";
}

export function trackEvent(event: AnalyticsParams): void {
  if (!analyticsAllowed()) return;
  if (typeof window === "undefined" || !window.gtag) return;

  const { action, category, label, value, locale, ...rest } = event;
  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value,
    locale,
    ...rest,
  });
}

/** GA4 user properties (requires analytics consent). */
export function setAnalyticsUserProperties(
  props: Record<string, string | number | boolean>,
): void {
  if (!analyticsAllowed()) return;
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("set", "user_properties", props);
}

declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
  }
}
