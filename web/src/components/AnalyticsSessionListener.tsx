"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { setAnalyticsUserProperties, trackEvent } from "@/lib/analytics";

const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED !== "0";

/** Tracks authenticated sessions and syncs logged_in user property to GA4. */
export function AnalyticsSessionListener() {
  const { status } = useSession();
  const prev = useRef(status);

  useEffect(() => {
    if (!AUTH_ENABLED) return;

    if (status === "authenticated" && prev.current !== "authenticated") {
      trackEvent({
        action: "sign_in_success",
        category: "auth",
        label: "session",
        provider: "google",
      });
    }

    setAnalyticsUserProperties({ logged_in: status === "authenticated" });
    prev.current = status;
  }, [status]);

  return null;
}
