import type { NextConfig } from "next";

/** e.g. "/chinese" if the site is served under a subpath (no trailing slash). */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? "";

const nextConfig: NextConfig = {
  /** Static HTML in `out/` — serve with nginx/Caddy/Apache only (no `next start`). */
  output: "export",
  images: { unoptimized: true },
  ...(basePath ? { basePath } : {}),
};

export default nextConfig;
