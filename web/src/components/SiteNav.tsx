"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/review", label: "Revisão", prefix: "/review" },
  { href: "/vocabulary", label: "Vocabulário", prefix: "/vocabulary" },
  { href: "/grammar", label: "Gramática", prefix: "/grammar" },
] as const;

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-ink/15 bg-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-6 sm:flex-row sm:items-end sm:justify-between">
        <Link
          href="/"
          className="font-display text-2xl tracking-tight text-ink hover:text-accent sm:text-3xl"
        >
          Chinês básico
        </Link>
        <nav className="flex flex-wrap gap-1 sm:gap-2" aria-label="Áreas do curso">
          {tabs.map((t) => {
            const isActive =
              pathname === t.prefix || pathname.startsWith(`${t.prefix}/`);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={
                  isActive
                    ? "border-b-2 border-accent px-3 py-2 text-sm font-medium text-ink"
                    : "border-b-2 border-transparent px-3 py-2 text-sm text-ink/60 hover:text-ink"
                }
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
