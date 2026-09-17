import { expect, type Page } from "@playwright/test";

export async function dismissCookieBanner(page: Page): Promise<void> {
  const dialog = page.getByRole("dialog");
  if (await dialog.isVisible().catch(() => false)) {
    const reject = dialog.getByRole("button", {
      name: /essential only|só essenciais|solo esenciales/i,
    });
    if (await reject.isVisible().catch(() => false)) {
      await reject.click();
    }
  }
}

export async function openOverflow(page: Page): Promise<void> {
  const button = page.getByRole("button", {
    name: /more areas|mais áreas|más áreas/i,
  });
  await expect(button).toBeVisible();
  await button.click();
}

export async function gotoReady(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => undefined);
}
