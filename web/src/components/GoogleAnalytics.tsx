"use client";

import Script from "next/script";
import { useEffect } from "react";
import { useConsent } from "@/context/ConsentContext";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";

function grantAnalyticsConsent(): void {
  window.gtag?.("consent", "update", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

/** Loads GA4 only after the user accepts analytics cookies. */
export function GoogleAnalytics() {
  const { analyticsAllowed, choice } = useConsent();

  useEffect(() => {
    if (!GA_ID || !analyticsAllowed) return;
    grantAnalyticsConsent();
    window.gtag?.("config", GA_ID, { send_page_view: false });
  }, [analyticsAllowed]);

  if (!GA_ID || choice === "unset" || !analyticsAllowed) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics-config" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { send_page_view: false });
        `}
      </Script>
    </>
  );
}
