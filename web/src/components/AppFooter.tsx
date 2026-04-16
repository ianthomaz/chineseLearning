"use client";

import { usePathname } from "next/navigation";
import { SiteAttributionCredits } from "@/components/SiteAttributionCredits";

function isRandomHanziPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === "/randomhanzi" || pathname.endsWith("/randomhanzi");
}

export function AppFooter() {
  const pathname = usePathname();
  if (isRandomHanziPath(pathname)) return null;

  return (
    <footer className="mx-auto max-w-6xl border-t border-ink/10 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom,0px))] sm:px-5 sm:py-10">
      <SiteAttributionCredits />
    </footer>
  );
}
