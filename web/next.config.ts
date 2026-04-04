import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

/** e.g. "/chinese" if the site is served under a subpath (no trailing slash). */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? "";

/** Static `out/` for nginx alias only — no Route Handlers (tutor needs `npm run start:server`). */
const staticExport = process.env.NEXT_STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  transpilePackages: ["react-pdf", "pdfjs-dist"],
  ...(staticExport
    ? {
        output: "export" as const,
        images: { unoptimized: true },
        /** Flat `*.html` paths break `python -m http.server` (no rewrite to `23.html`). Folders + index.html work with `/path/`. */
        trailingSlash: true,
      }
    : {}),
  ...(basePath ? { basePath } : {}),
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
