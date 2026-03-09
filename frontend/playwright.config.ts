import { defineConfig, devices } from "@playwright/test";

/**
 * DFM Terminal — Playwright E2E configuration
 * Assumes both services are already running:
 *   backend  → http://localhost:8000
 *   frontend → http://localhost:3000
 * Run: npm run test:e2e
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,     // sequential — avoids API rate contention
  forbidOnly: !!process.env.CI,
  retries: 1,               // one retry on flaky UI timing
  workers: 1,
  timeout: 40_000,          // 40 s per test (data may be slow to load)
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
