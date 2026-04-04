"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

type PdfLib = typeof import("react-pdf");

let workerSrcSet = false;

function ensureWorker(m: PdfLib) {
  if (workerSrcSet) return;
  m.pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${m.pdfjs.version}/build/pdf.worker.min.mjs`;
  workerSrcSet = true;
}

type Props = {
  pdfUrl: string;
  title: string;
  t: (path: string, vars?: Record<string, string | number>) => string;
};

export function VisualPdfPager({ pdfUrl, title, t }: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [lib, setLib] = useState<PdfLib | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFs, setIsFs] = useState(false);
  const [pageWidth, setPageWidth] = useState(640);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("react-pdf").then((m) => {
      if (cancelled) return;
      ensureWorker(m);
      setLib(m);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setPage(1);
    setNumPages(null);
    setLoadError(null);
  }, [pdfUrl]);

  const updatePageWidth = useCallback(() => {
    const el = shellRef.current;
    if (!el) return;
    if (document.fullscreenElement === el) {
      setPageWidth(Math.max(240, window.innerWidth - 56));
    } else {
      setPageWidth(Math.max(240, Math.min(el.clientWidth - 32, 920)));
    }
  }, []);

  useLayoutEffect(() => {
    updatePageWidth();
  }, [updatePageWidth, lib]);

  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => updatePageWidth());
    ro.observe(el);
    const onResize = () => updatePageWidth();
    window.addEventListener("resize", onResize);
    const onFs = () => {
      setIsFs(!!document.fullscreenElement);
      queueMicrotask(updatePageWidth);
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, [updatePageWidth]);

  const toggleFullscreen = useCallback(async () => {
    const el = shellRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      /* ignore */
    }
  }, []);

  const onShellKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPage((p) => Math.max(1, p - 1));
      }
      if (e.key === "ArrowRight" && numPages) {
        e.preventDefault();
        setPage((p) => Math.min(numPages, p + 1));
      }
    },
    [numPages],
  );

  const onTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStart(e.touches[0].clientX);
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (touchStart === null) return;
      const touchEnd = e.changedTouches[0].clientX;
      const diff = touchStart - touchEnd;

      // Minimum swipe distance
      if (Math.abs(diff) < 50) return;

      if (diff > 0) {
        // Swiped left - next page
        setPage((p) => (numPages ? Math.min(numPages, p + 1) : p));
      } else {
        // Swiped right - previous page
        setPage((p) => Math.max(1, p - 1));
      }
      setTouchStart(null);
    },
    [touchStart, numPages],
  );

  const uiFont = { fontFamily: "ui-sans-serif, system-ui, sans-serif" } as const;

  if (!lib) {
    return (
      <div
        className="flex min-h-[12rem] items-center justify-center rounded-xl border bg-stone-100/80 text-sm text-ink/50"
        style={{ borderColor: "var(--border)", ...uiFont }}
      >
        {t("visuals.pdfLoading")}
      </div>
    );
  }

  const { Document, Page } = lib;
  const total = numPages ?? 0;
  const canPrev = page > 1;
  const canNext = total > 0 && page < total;

  return (
    <div
      ref={shellRef}
      tabIndex={0}
      role="region"
      aria-label={title}
      onKeyDown={onShellKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className={
        isFs
          ? "flex h-full w-full flex-col bg-paper outline-none"
          : "flex flex-col overflow-hidden rounded-xl border bg-stone-50 outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-accent"
      }
      style={{ borderColor: isFs ? "transparent" : "var(--border)" }}
    >
      {/* Simplified Top Bar */}
      <div
        className="flex items-center justify-between gap-2 border-b bg-paper px-4 py-3 sm:px-6"
        style={uiFont}
      >
        <span className="text-xs font-medium tracking-wide text-ink/60">
          {total > 0
            ? t("visuals.pdfPageOf", { current: String(page), total: String(total) })
            : "—"}
        </span>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="rounded-lg px-2 py-1.5 text-xs font-medium text-ink/70 transition-colors hover:bg-ink/5"
          title={isFs ? t("visuals.pdfExitFullscreen") : t("visuals.pdfFullscreen")}
        >
          {isFs ? "⛶" : "⛶"}
        </button>
      </div>

      {/* PDF Viewer Area */}
      <div className="flex min-h-[min(70dvh,720px)] flex-1 items-center justify-center overflow-auto bg-stone-100/50 p-3 sm:min-h-[min(75dvh,800px)] sm:p-4 select-none">
        {loadError ? (
          <p className="text-sm text-red-700">{loadError}</p>
        ) : (
          <Document
            file={pdfUrl}
            loading={
              <div className="py-12 text-sm text-ink/45" style={uiFont}>
                {t("visuals.pdfLoading")}
              </div>
            }
            onLoadSuccess={(doc) => {
              setNumPages(doc.numPages);
              setLoadError(null);
            }}
            onLoadError={() => {
              setLoadError(t("visuals.pdfError"));
              setNumPages(null);
            }}
          >
            <Page
              pageNumber={page}
              width={pageWidth}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="shadow-lg drop-shadow-sm"
            />
          </Document>
        )}
      </div>

      {/* Navigation Footer */}
      <div
        className="border-t bg-paper px-4 py-2 sm:px-6 flex items-center justify-between gap-2"
        style={uiFont}
      >
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors enabled:hover:bg-ink/5 disabled:opacity-30 disabled:cursor-not-allowed text-center"
        >
          ← {t("visuals.pdfPrev")}
        </button>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => setPage((p) => (total ? Math.min(total, p + 1) : p))}
          className="flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors enabled:hover:bg-ink/5 disabled:opacity-30 disabled:cursor-not-allowed text-center"
        >
          {t("visuals.pdfNext")} →
        </button>
      </div>

      {/* Gesture Hint */}
      <p className="bg-paper px-4 py-1.5 text-center text-[11px] text-ink/40" style={uiFont}>
        {t("visuals.pdfKeyboardHint")}
      </p>
    </div>
  );
}
