"use client";

import { AnalyticsRouteListener } from "@/components/AnalyticsRouteListener";
import { AnalyticsSessionListener } from "@/components/AnalyticsSessionListener";
import { AuthSessionProvider } from "@/components/AuthSessionProvider";
import { CookieBanner } from "@/components/CookieBanner";
import { EdgeSettingsDrawer } from "@/components/EdgeSettingsDrawer";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { ConsentProvider } from "@/context/ConsentContext";
import { LocaleProvider } from "@/context/LocaleContext";
import { PinyinProvider } from "@/context/PinyinContext";
import { TranslationProvider } from "@/context/TranslationContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConsentProvider>
      <AuthSessionProvider>
        <LocaleProvider>
          <PinyinProvider>
            <TranslationProvider>
              <AnalyticsRouteListener />
              <AnalyticsSessionListener />
              <GoogleAnalytics />
              {children}
              <EdgeSettingsDrawer />
              <CookieBanner />
            </TranslationProvider>
          </PinyinProvider>
        </LocaleProvider>
      </AuthSessionProvider>
    </ConsentProvider>
  );
}
