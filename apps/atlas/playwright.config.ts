import { defineConfig } from "@playwright/test";
const port = process.env.ATLAS_TEST_PORT ?? "4311";
const baseURL = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: "tests/browser",
  workers: 1,
  timeout: 30000,
  use: {
    baseURL,
    browserName: "chromium",
    channel: process.env.CI ? undefined : "chrome",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm start",
    url: `${baseURL}/health/live`,
    // Never inherit a live provider from the operator's .env during browser tests.
    env: { PORT: port, ATLAS_PROVIDER_MODE: "fake" },
    reuseExistingServer: false,
    timeout: 120000,
  },
});
