/** Base path without trailing slash (e.g. "/aulaChines"), from build-time env. */
export function getPublicBasePath(): string {
  return (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
}

/** Absolute path for browser fetch under basePath (dev: ""). */
export function withPublicBasePath(path: string): string {
  const base = getPublicBasePath();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
