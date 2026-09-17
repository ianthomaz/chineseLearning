/**
 * Routes that manage their own full-height layout instead of sitting inside the
 * normal page chrome. Kept in one place so the footer, the settings drawer and
 * the nav cannot drift apart.
 */

/** Own full-viewport UI: no site footer, no floating settings drawer. */
const IMMERSIVE_ROUTES = ["/randomhanzi", "/praticar", "/ktv"] as const;

/** Also replaces the site header (dark, edge-to-edge). */
const NO_SITE_NAV_ROUTES = ["/ktv"] as const;

function matches(pathname: string | null, routes: readonly string[]): boolean {
  if (!pathname) return false;
  // Paths are compared with and without a basePath prefix, since the production
  // server strips `/aulaChines` before Next but static export does not.
  return routes.some((route) => pathname === route || pathname.endsWith(route));
}

export function isImmersiveRoute(pathname: string | null): boolean {
  return matches(pathname, IMMERSIVE_ROUTES);
}

export function hidesSiteNav(pathname: string | null): boolean {
  return matches(pathname, NO_SITE_NAV_ROUTES);
}
