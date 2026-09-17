/**
 * Routes that manage their own full-height layout instead of sitting inside the
 * normal page chrome. Kept in one place so the footer, the settings drawer and
 * the nav cannot drift apart.
 */

/** Own full-viewport UI: no site footer, no floating settings drawer. */
const IMMERSIVE_ROUTES = ["/randomhanzi", "/praticar", "/ktv"] as const;

/**
 * Routes where the reading-settings drawer has nothing to control. The phrase
 * game reads none of the pinyin/translation contexts — it has its own hint
 * settings — so the tab was a dead control sitting on top of the board.
 */
const NO_READING_DRAWER_ROUTES = ["/phrase-game"] as const;

/** Also replaces the site header (dark, edge-to-edge). */
const NO_SITE_NAV_ROUTES = ["/ktv"] as const;

function matches(pathname: string | null, routes: readonly string[]): boolean {
  if (!pathname) return false;
  // Paths are compared with and without a basePath prefix, since the production
  // Immersive routes use absolute paths from site root.
  return routes.some((route) => pathname === route || pathname.endsWith(route));
}

export function isImmersiveRoute(pathname: string | null): boolean {
  return matches(pathname, IMMERSIVE_ROUTES);
}

/** Immersive routes plus the ones whose content ignores the reading settings. */
export function hidesReadingDrawer(pathname: string | null): boolean {
  return matches(pathname, IMMERSIVE_ROUTES) || matches(pathname, NO_READING_DRAWER_ROUTES);
}

export function hidesSiteNav(pathname: string | null): boolean {
  return matches(pathname, NO_SITE_NAV_ROUTES);
}
