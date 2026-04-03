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
    <header className="border-b bg-paper" style={{ borderColor: "var(--border)" }}>
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="font-display text-xl font-medium tracking-tight text-ink hover:text-accent transition-colors"
        >
          漢語 <span className="text-ink/40 font-light">· Chinês básico</span>
        </Link>

        <nav className="flex gap-1" aria-label="Áreas do curso">
          {tabs.map((t) => {
            const isActive =
              pathname === t.prefix || pathname.startsWith(`${t.prefix}/`);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={
                  isActive
                    ? "rounded-full px-4 py-1.5 text-sm font-medium text-white transition-colors"
                    : "rounded-full px-4 py-1.5 text-sm text-ink/55 hover:text-ink hover:bg-ink/5 transition-colors"
                }
                style={isActive ? { backgroundColor: "var(--accent)" } : {}}
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
