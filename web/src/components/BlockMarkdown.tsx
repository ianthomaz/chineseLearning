"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  markdown: string;
  className?: string;
};

/**
 * Renders `narrative` from consolidado (GFM tables, headings, lists).
 */
export function BlockMarkdown({ markdown, className = "" }: Props) {
  const md = markdown.trim();
  if (!md) return null;

  return (
    <div
      className={`block-markdown mb-10 text-sm leading-relaxed text-ink/85 ${className}`.trim()}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2
              className="mb-3 mt-10 font-display text-lg font-medium text-ink first:mt-0"
              style={{ fontFamily: "var(--font-display, ui-serif, Georgia, serif)" }}
            >
              {children}
            </h2>
          ),
          p: ({ children }) => (
            <p className="mb-3 last:mb-0" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 list-disc space-y-1.5 pl-5 last:mb-0">{children}</ul>
          ),
          li: ({ children }) => (
            <li style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>{children}</li>
          ),
          strong: ({ children }) => <strong className="font-medium text-ink">{children}</strong>,
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
              <table className="w-full min-w-[20rem] border-collapse text-left text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead style={{ backgroundColor: "rgba(28,25,23,0.04)" }}>{children}</thead>,
          th: ({ children }) => (
            <th
              className="border-b px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink/50"
              style={{
                fontFamily: "ui-sans-serif, system-ui, sans-serif",
                borderColor: "var(--border)",
              }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              className="border-b px-3 py-2 align-top text-ink/90"
              style={{
                fontFamily: "ui-sans-serif, system-ui, sans-serif",
                borderColor: "var(--border)",
              }}
            >
              {children}
            </td>
          ),
          hr: () => <hr className="my-8 border-0 border-t" style={{ borderColor: "var(--border)" }} />,
        }}
      >
        {md}
      </ReactMarkdown>
    </div>
  );
}
