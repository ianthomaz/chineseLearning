import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

/** e.g. "/chinese" if the site is served under a subpath (no trailing slash). */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? "";

/** Static `out/` for nginx alias only — no Route Handlers (tutor needs `npm run start:server`). */
const staticExport = process.env.NEXT_STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(staticExport
    ? { output: "export" as const, images: { unoptimized: true } }
    : {}),
  ...(basePath ? { basePath } : {}),
};

const withPWA = withPWAInit({
  dest: "public",
  disable:
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PWA_DISABLED === "1",
  register: true,
});

export default withPWA(nextConfig);
