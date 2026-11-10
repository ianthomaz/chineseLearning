"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useLocale } from "@/context/LocaleContext";
import { trackEvent } from "@/lib/analytics";

/** SPA page views — GA only sees the first paint without this. */
export function AnalyticsRouteListener() {
  const pathname = usePathname();
  const { locale } = useLocale();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === last.current) return;
    const previousPath = last.current;
    last.current = pathname;

    const pageTitle = typeof document !== "undefined" ? document.title : "";
    const pageLocation = typeof window !== "undefined" ? window.location.href : pathname;
    const pageReferrer = previousPath || (typeof document !== "undefined" ? document.referrer : "");

    trackEvent({
      action: "page_view",
      category: "navigation",
      label: pathname,
      path: pathname,
      page_path: pathname,
      page_title: pageTitle,
      page_location: pageLocation,
      previous_path: previousPath || "(landing)",
      page_referrer: pageReferrer,
      locale,
    });

    const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
    if (gaId && typeof window !== "undefined") {
      window.gtag?.("config", gaId, {
        page_path: pathname,
        page_title: pageTitle,
        page_location: pageLocation,
        page_referrer: pageReferrer,
      });
    }
  }, [pathname, locale]);

  return null;
}
