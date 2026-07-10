"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

type Theme = "light" | "dark";

/** Light/dark toggle. Persists to localStorage; the no-flash script in the
 *  document head applies the saved choice before paint. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "dark" || attr === "light") {
      setTheme(attr);
    } else {
      setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    }
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Tema claro" : "Tema escuro"}
      title={theme === "dark" ? "Tema claro" : "Tema escuro"}
      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border text-ink/65 transition-colors hover:bg-ink/5"
    >
      {theme === null ? (
        <span className="inline-block h-[1.1em] w-[1.1em]" aria-hidden />
      ) : (
        <Icon name={theme === "dark" ? "sun" : "moon"} size="1.1em" />
      )}
    </button>
  );
}
