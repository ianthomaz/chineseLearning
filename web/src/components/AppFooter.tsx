"use client";

import { usePathname } from "next/navigation";
import { FooterKtvLink } from "@/components/FooterKtvLink";
import { SiteAttributionCredits } from "@/components/SiteAttributionCredits";

function isImmersivePath(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname === "/randomhanzi" ||
    pathname.endsWith("/randomhanzi") ||
    pathname === "/praticar" ||
    pathname.endsWith("/praticar") ||
    pathname === "/ktv" ||
    pathname.endsWith("/ktv")
  );
}

export function AppFooter() {
  const pathname = usePathname();
  if (isImmersivePath(pathname)) return null;

  return (
    <footer className="mx-auto max-w-5xl border-t border-border px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom,0px))] sm:px-5 sm:py-10">
      <SiteAttributionCredits />
      <FooterKtvLink />
    </footer>
  );
}
