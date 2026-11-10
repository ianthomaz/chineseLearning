/**
 * Campaign attribution and traffic origin helper.
 *
 * Captures UTM parameters (utm_source, utm_medium, utm_campaign, utm_content,
 * utm_term), Google Click ID (gclid), and organic referrers. Persists in
 * sessionStorage so client-side SPA navigation preserves the original source.
 */

export type CampaignAttribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string;
  landing_page?: string;
  initial_referrer?: string;
  captured_at?: string;
};

const STORAGE_KEY = "lc_attribution.v1";

function detectReferrerSource(referrer: string): { source: string; medium: string } | null {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    const host = url.hostname.toLowerCase();

    if (host.includes("google.")) return { source: "google", medium: "organic" };
    if (host.includes("bing.")) return { source: "bing", medium: "organic" };
    if (host.includes("duckduckgo.")) return { source: "duckduckgo", medium: "organic" };
    if (host.includes("baidu.")) return { source: "baidu", medium: "organic" };
    if (host.includes("instagram.com")) return { source: "instagram", medium: "social" };
    if (host.includes("t.co") || host.includes("twitter.com") || host.includes("x.com")) {
      return { source: "x", medium: "social" };
    }
    if (host.includes("facebook.com")) return { source: "facebook", medium: "social" };
    if (host.includes("tiktok.com")) return { source: "tiktok", medium: "social" };
    if (host.includes("youtube.com")) return { source: "youtube", medium: "social" };
    if (host.includes("linkedin.com")) return { source: "linkedin", medium: "social" };
    if (host.includes("reddit.com")) return { source: "reddit", medium: "social" };

    return { source: host, medium: "referral" };
  } catch {
    return null;
  }
}

/**
 * Reads campaign attribution from URL search params or referrer on landing,
 * caching in sessionStorage for the duration of the visit.
 */
export function captureAttribution(): CampaignAttribution {
  if (typeof window === "undefined") return {};

  // Check if we already have attribution for this session
  let existing: CampaignAttribution | null = null;
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) existing = JSON.parse(stored) as CampaignAttribution;
  } catch {
    /* ignore */
  }

  // Parse current URL
  const url = new URL(window.location.href);
  const qSource = url.searchParams.get("utm_source")?.trim();
  const qMedium = url.searchParams.get("utm_medium")?.trim();
  const qCampaign = url.searchParams.get("utm_campaign")?.trim();
  const qContent = url.searchParams.get("utm_content")?.trim();
  const qTerm = url.searchParams.get("utm_term")?.trim();
  const gclid = url.searchParams.get("gclid")?.trim();

  const hasNewParams = qSource || qMedium || qCampaign || gclid;

  // If new campaign in URL, override existing
  if (hasNewParams || !existing) {
    let source = qSource;
    let medium = qMedium;

    if (!source && document.referrer) {
      const detected = detectReferrerSource(document.referrer);
      if (detected) {
        source = detected.source;
        medium = detected.medium;
      }
    }

    const attribution: CampaignAttribution = {
      utm_source: source || (hasNewParams ? undefined : "direct"),
      utm_medium: medium || (hasNewParams ? undefined : "none"),
      utm_campaign: qCampaign || undefined,
      utm_content: qContent || undefined,
      utm_term: qTerm || undefined,
      gclid: gclid || undefined,
      landing_page: window.location.pathname + window.location.search,
      initial_referrer: document.referrer || undefined,
      captured_at: new Date().toISOString(),
    };

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
    } catch {
      /* ignore */
    }

    return attribution;
  }

  return existing;
}

export function getStoredAttribution(): CampaignAttribution {
  if (typeof window === "undefined") return {};
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as CampaignAttribution;
  } catch {
    /* ignore */
  }
  return captureAttribution();
}

/**
 * Sets attribution values in Google Analytics so every event automatically carries
 * the campaign source and medium.
 */
export function applyAttributionToGtag(attribution: CampaignAttribution): void {
  if (typeof window === "undefined" || !window.gtag) return;

  const params: Record<string, unknown> = {};
  if (attribution.utm_source) params.campaign_source = attribution.utm_source;
  if (attribution.utm_medium) params.campaign_medium = attribution.utm_medium;
  if (attribution.utm_campaign) params.campaign_name = attribution.utm_campaign;
  if (attribution.utm_term) params.campaign_term = attribution.utm_term;
  if (attribution.utm_content) params.campaign_content = attribution.utm_content;
  if (attribution.landing_page) params.landing_page = attribution.landing_page;

  if (Object.keys(params).length > 0) {
    window.gtag("set", params);
  }
}
