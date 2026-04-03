import type { NextConfig } from "next";

/** e.g. "/chinese" if the site is served under a subpath (no trailing slash). */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? "";

/** Static `out/` for nginx alias only — no Route Handlers (tutor needs `next start`). */
const staticExport = process.env.NEXT_STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(staticExport
    ? { output: "export" as const, images: { unoptimized: true } }
    : {}),
  ...(basePath ? { basePath } : {}),
};

export default nextConfig;
