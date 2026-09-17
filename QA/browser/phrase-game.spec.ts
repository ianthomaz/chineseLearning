import { test, expect } from "@playwright/test";
import { dismissCookieBanner, gotoReady } from "./helpers";

test.describe("phrase game", () => {
  test("setup screen shows knowledge and how-to-play presets", async ({ page }) => {
    await gotoReady(page, "/phrase-game");
    await dismissCookieBanner(page);
    await expect(page.getByText(/knowledge|conhecimento|conocimiento/i).first()).toBeVisible();
    await expect(
      page.getByText(/how do you want to play|como você quer jogar|cómo quieres jugar/i),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /^play$|^jogar$|^jugar$/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /^read$/i })).toHaveCount(0);
  });
});
