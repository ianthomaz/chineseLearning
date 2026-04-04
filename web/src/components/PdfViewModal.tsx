"use client";

import { useEffect, useId } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Absolute URL to the PDF (include basePath). */
  src: string | null;
  documentTitle: string;
  closeLabel: string;
  backdropCloseLabel: string;
};

/**
 * Inline PDF viewing in a modal. No <a download> — we do not trigger a file download from our UI.
 * Browsers may still expose save/print in the built-in PDF UI; true protection would need a dedicated stream/backend.
 */
export function PdfViewModal({
  open,
  onClose,
  src,
  documentTitle,
  closeLabel,
  backdropCloseLabel,
}: Props) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || !src) return null;

  const iframeSrc = `${src.split("#")[0]}#toolbar=0`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-stone-900"
        aria-label={backdropCloseLabel}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[101] flex h-[100dvh] w-full max-w-5xl flex-col rounded-none border-0 bg-white shadow-xl sm:h-[min(92dvh,900px)] sm:rounded-2xl sm:border sm:border-stone-200"
        style={{ backgroundColor: "#ffffff" }}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-stone-200 px-4 py-3 sm:px-5">
          <h2
            id={titleId}
            className="min-w-0 truncate font-display text-base font-medium text-stone-900 sm:text-lg"
          >
            {documentTitle}
          </h2>
          <button
            type="button"
            className="shrink-0 rounded-lg px-3 py-2 text-sm text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 active:bg-stone-200"
            onClick={onClose}
          >
            {closeLabel}
          </button>
        </header>
        <div className="min-h-0 flex-1 bg-stone-100 p-0 sm:p-2">
          <iframe
            title={documentTitle}
            src={iframeSrc}
            className="h-full w-full border-0 bg-white"
            style={{ backgroundColor: "#ffffff" }}
          />
        </div>
      </div>
    </div>
  );
}
