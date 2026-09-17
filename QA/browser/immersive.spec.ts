import { test, expect } from "@playwright/test";
import { dismissCookieBanner, gotoReady } from "./helpers";

test.describe("immersive chrome", () => {
  test("/ktv hides site nav and footer", async ({ page }) => {
    await gotoReady(page, "/ktv");
    await dismissCookieBanner(page);
    await expect(page.getByRole("navigation", { name: /main practice|prática principal/i })).toHaveCount(0);
    await expect(page.getByRole("contentinfo")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^read$/i })).toHaveCount(0);
    await expect(page.getByRole("combobox", { name: /choose a song|escolher música|elegir canción/i })).toBeVisible();
  });

  test("/practice hides footer and reading drawer", async ({ page }) => {
    await gotoReady(page, "/practice");
    await dismissCookieBanner(page);
    await expect(page.getByRole("contentinfo")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^read$/i })).toHaveCount(0);
  });
});
