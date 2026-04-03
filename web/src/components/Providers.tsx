"use client";

import { EdgeSettingsDrawer } from "@/components/EdgeSettingsDrawer";
import { LocaleProvider } from "@/context/LocaleContext";
import { PinyinProvider } from "@/context/PinyinContext";
import { TranslationProvider } from "@/context/TranslationContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <PinyinProvider>
        <TranslationProvider>
          {children}
          <EdgeSettingsDrawer />
        </TranslationProvider>
      </PinyinProvider>
    </LocaleProvider>
  );
}
