import { defineConfig } from "@playwright/test";

const baseURL = (process.env.BASE_URL || "https://learnchinese.today").replace(
  /\/$/,
  "",
);

export default defineConfig({
  testDir: "./browser",
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 12_000 },
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "reports/playwright" }],
  ],
  use: {
    baseURL,
    trace: "on-first-retry",
    locale: "en-US",
  },
  outputDir: "test-results",
  projects: [
    {
      name: "desktop",
      use: { viewport: { width: 1280, height: 800 } },
    },
    {
      name: "mobile-390",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
