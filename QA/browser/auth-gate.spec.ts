import { test, expect } from "@playwright/test";
import { dismissCookieBanner, gotoReady } from "./helpers";

const GATED = ["/practice", "/tutor", "/gamification"] as const;

test.describe("auth gates", () => {
  for (const path of GATED) {
    test(`${path} shows sign-in or disabled copy for guests`, async ({ page }) => {
      await gotoReady(page, path);
      await dismissCookieBanner(page);
      const signIn = page.getByRole("heading", {
        name: /sign in to continue|entre para continuar|inicia sesión para continuar|feature disabled|funcionalidade desativada|funcionalidad desactivada/i,
      });
      await expect(signIn).toBeVisible({ timeout: 15_000 });
    });
  }
});
