import { getConsentChoiceSync } from "@/context/ConsentContext";
import { getStoredAttribution } from "@/lib/attribution";

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
  page_path?: string;
  page_title?: string;
  page_location?: string;
  previous_path?: string;
  page_referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  landing_page?: string;
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
  [key: string]: unknown;
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
  const attr = getStoredAttribution();

  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value,
    locale,
    ...(attr.utm_source && !rest.utm_source ? { utm_source: attr.utm_source } : {}),
    ...(attr.utm_medium && !rest.utm_medium ? { utm_medium: attr.utm_medium } : {}),
    ...(attr.utm_campaign && !rest.utm_campaign ? { utm_campaign: attr.utm_campaign } : {}),
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
