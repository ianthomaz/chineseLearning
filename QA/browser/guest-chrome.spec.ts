import { test, expect } from "@playwright/test";
import { dismissCookieBanner, gotoReady, openOverflow } from "./helpers";

test.describe("guest chrome", () => {
  test("home shows title and primary nav", async ({ page }) => {
    await gotoReady(page, "/");
    await dismissCookieBanner(page);
    await expect(page.getByRole("link", { name: /漢語/ })).toBeVisible();
    await expect(page.getByRole("navigation", { name: /main practice|prática principal/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /^phrases$|^frases$/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /^quiz$/i }).first()).toBeVisible();
  });

  test("privacy and terms load", async ({ page }) => {
    await gotoReady(page, "/privacy");
    await dismissCookieBanner(page);
    await expect(page.locator("h1, h2").first()).toBeVisible();
    await gotoReady(page, "/terms");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("cookie banner reject does not load GA", async ({ page }) => {
    const gaHits: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("googletagmanager.com/gtag/js") && req.url().includes("G-2YMPSSQJND")) {
        gaHits.push(req.url());
      }
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: /essential only|só essenciais|solo esenciales/i }).click();
    await page.waitForTimeout(2500);
    expect(gaHits, "GA script should not load after essential-only").toEqual([]);
  });

  test("cookie banner accept can load GA", async ({ page }) => {
    const base = process.env.BASE_URL || "https://learnchinese.today";
    test.skip(!base.includes("learnchinese.today"), "GA script asserted on production");
    const ga = page.waitForRequest(
      (req) =>
        req.url().includes("googletagmanager.com/gtag/js") &&
        req.url().includes("G-2YMPSSQJND"),
      { timeout: 12_000 },
    );
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: /accept analytics|aceitar analíticos|aceptar analíticas/i }).click();
    await expect(ga).resolves.toBeTruthy();
  });

  test("locale switch en → pt → es updates nav labels", async ({ page }) => {
    await gotoReady(page, "/");
    await dismissCookieBanner(page);
    await openOverflow(page);
    await page.getByRole("option", { name: /português/i }).first().click();
    await expect(page.getByRole("link", { name: /^frases$/i }).first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText("nav.phraseGame");

    await openOverflow(page);
    await page.getByRole("option", { name: /español/i }).first().click();
    await expect(page.getByRole("link", { name: /^frases$/i }).first()).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "es");

    await openOverflow(page);
    await page.getByRole("option", { name: /english/i }).first().click();
    await expect(page.getByRole("link", { name: /^phrases$/i }).first()).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("theme toggle sets data-theme", async ({ page }) => {
    await gotoReady(page, "/");
    await dismissCookieBanner(page);
    await openOverflow(page);
    const toggle = page.getByRole("button", { name: /tema (claro|escuro)/i }).first();
    await expect(toggle).toBeVisible();
    const before = await page.locator("html").getAttribute("data-theme");
    await toggle.click();
    const after = await page.locator("html").getAttribute("data-theme");
    expect(after === "light" || after === "dark").toBeTruthy();
    if (before) expect(after).not.toBe(before);
  });
});
