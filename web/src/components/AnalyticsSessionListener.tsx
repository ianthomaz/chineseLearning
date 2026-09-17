"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { setAnalyticsUserProperties, trackEvent } from "@/lib/analytics";

const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED !== "0";

/** Tracks authenticated sessions and syncs logged_in user property to GA4. */
export function AnalyticsSessionListener() {
  // `useSession` needs a SessionProvider, which the static export does not
  // render. Bail before the hook rather than inside the effect — by then the
  // destructure has already thrown and prerendering fails.
  if (!AUTH_ENABLED) return null;
  return <AnalyticsSessionListenerLive />;
}

function AnalyticsSessionListenerLive() {
  const { status } = useSession();
  const prev = useRef(status);

  useEffect(() => {
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
