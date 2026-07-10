import type { ReactNode } from "react";

/** Raised surface with the standard rounded border. Set `interactive` for hover. */
export function Card({
  children,
  className = "",
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface p-5 sm:p-6 ${
        interactive ? "transition-colors hover:border-accent/40 hover:bg-ink/[0.02]" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
