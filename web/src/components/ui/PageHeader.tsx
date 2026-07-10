import type { ReactNode } from "react";

/**
 * Standard page header: optional uppercase kicker, a serif display title, and
 * optional subtitle / action children. Replaces the copy-pasted header block.
 */
export function PageHeader({
  kicker,
  title,
  subtitle,
  actions,
  className = "",
}: {
  kicker?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`mb-8 ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {kicker ? (
            <p className="font-sans text-xs font-medium uppercase tracking-widest text-ink/40">
              {kicker}
            </p>
          ) : null}
          <h1 className="mt-1 font-display text-2xl font-medium text-ink sm:text-3xl md:text-4xl">
            {title}
          </h1>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      {subtitle ? <p className="mt-3 max-w-2xl font-sans text-sm text-ink/60">{subtitle}</p> : null}
    </header>
  );
}
