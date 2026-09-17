"use client";

import { usePathname } from "next/navigation";
import { SiteAttributionCredits } from "@/components/SiteAttributionCredits";
import { SiteLegalLinks } from "@/components/SiteLegalLinks";
import { isImmersiveRoute } from "@/lib/immersive-routes";

export function AppFooter() {
  const pathname = usePathname();
  if (isImmersiveRoute(pathname)) return null;

  return (
    <footer className="mx-auto max-w-5xl border-t border-border px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom,0px))] sm:px-5 sm:py-10">
      <SiteLegalLinks />
      <SiteAttributionCredits />
    </footer>
  );
}
