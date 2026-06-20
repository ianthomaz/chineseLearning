import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

/** e.g. "/chinese" if the site is served under a subpath (no trailing slash). */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? "";

/** Static `out/` for nginx alias only — no Route Handlers (tutor needs `npm run start:server`). */
const staticExport = process.env.NEXT_STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  transpilePackages: ["react-pdf", "pdfjs-dist"],
  // The auth/progress API routes are server-only: `route.server.ts`. The `.server.ts`
  // extension is recognised as a route handler ONLY in the server build (`build:server`,
  // `dev`). Under static export the extension is dropped, so those files are not routes —
  // the routes simply do not exist in `output: 'export'` (no dynamic route handler to
  // break the build), and the UI degrades to guest-only via NEXT_PUBLIC_AUTH_ENABLED=0.
  // Every other route uses the plain `.ts`/`.tsx` extensions in both modes.
  pageExtensions: staticExport
    ? ["ts", "tsx", "js", "jsx"]
    : ["server.ts", "server.tsx", "ts", "tsx", "js", "jsx"],
  ...(staticExport
    ? {
        output: "export" as const,
        images: { unoptimized: true },
        /** Flat `*.html` paths break `python -m http.server` (no rewrite to `23.html`). Folders + index.html work with `/path/`. */
        trailingSlash: true,
      }
    : {}),
  ...(basePath ? { basePath } : {}),
  // Intentionally no `redirects()`: `scripts/start-server-stripped.mjs` strips `basePath` before
  // Next, so internal paths are `/`, `/randomhanzi`, etc. Redirects to `${basePath}/…` would loop
  // in the browser (ERR_TOO_MANY_REDIRECTS).
  /** Prefer in-browser viewing over attachment download for vocabulary PDFs. */
  async headers() {
    const prefix = basePath || "";
    return [
      {
        source: `${prefix}/downloads/:path*.pdf`,
        headers: [{ key: "Content-Disposition", value: "inline" }],
      },
    ];
  },
};

const withPWA = withPWAInit({
  dest: "public",
  disable:
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PWA_DISABLED === "1",
  register: true,
});

export default withPWA(nextConfig);
