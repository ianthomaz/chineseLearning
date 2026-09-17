import { test, expect } from "@playwright/test";
import { dismissCookieBanner, gotoReady, openOverflow } from "./helpers";

test.describe("mobile 390", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1280) > 500, "390px only");

  test("overflow menu opens and overflow links are tappable", async ({ page }) => {
    await gotoReady(page, "/");
    await dismissCookieBanner(page);
    const overflow = page.getByRole("button", { name: /more areas|mais áreas|más áreas/i });
    const box = await overflow.boundingBox();
    expect(box, "overflow control exists").toBeTruthy();
    expect(box!.height).toBeGreaterThanOrEqual(40);
    expect(box!.width).toBeGreaterThanOrEqual(40);
    await openOverflow(page);
    const review = page.getByRole("link", { name: /^review$|^revisão$|^repaso$/i }).first();
    await expect(review).toBeVisible();
    const rbox = await review.boundingBox();
    expect(rbox!.height).toBeGreaterThanOrEqual(40);
    await review.click();
    await expect(page).toHaveURL(/\/review\/?$/);
  });
});
