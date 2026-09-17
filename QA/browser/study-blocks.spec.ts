import { test, expect } from "@playwright/test";
import { dismissCookieBanner, gotoReady } from "./helpers";

test.describe("study + ktv content", () => {
  test("review index opens a block", async ({ page }) => {
    await gotoReady(page, "/review");
    await dismissCookieBanner(page);
    const block = page.locator('a[href^="/review/"]').first();
    await expect(block).toBeVisible();
    await block.click();
    await expect(page).toHaveURL(/\/review\/\d+/);
    await expect(page.locator("main, h1").first()).toBeVisible();
  });

  test("ktv catalog lists a song and offers a mode", async ({ page }) => {
    await gotoReady(page, "/ktv");
    await dismissCookieBanner(page);
    const picker = page.getByRole("combobox", {
      name: /choose a song|escolher música|elegir canción/i,
    });
    await expect(picker).toBeVisible();
    await expect(picker.locator("option").first()).toBeAttached();
    await expect(
      page.getByRole("button", { name: /hanzi \+ pinyin/i }),
    ).toBeVisible();
  });
});
