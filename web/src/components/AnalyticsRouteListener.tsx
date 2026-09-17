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
    last.current = pathname;
    trackEvent({
      action: "page_view",
      category: "navigation",
      label: pathname,
      path: pathname,
      locale,
    });
    const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
    if (gaId) {
      window.gtag?.("config", gaId, {
        page_path: pathname,
        page_title: document.title,
      });
    }
  }, [pathname, locale]);

  return null;
}
