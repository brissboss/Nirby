import path from "node:path";

import { defineConfig, devices } from "@playwright/test";

import { apiEnvForWebServer, mergeEnv, repoRoot } from "./src/env";

const isCi = Boolean(process.env.CI);
const apiEnv = apiEnvForWebServer();
const apiPort = apiEnv.PORT;
const webPort = process.env.E2E_WEB_PORT ?? "3000";
const apiUrl = `http://localhost:${apiPort}`;
const webUrl = `http://localhost:${webPort}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  workers: isCi ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  outputDir: "test-results",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  globalSetup: "./global-setup.ts",
  globalTeardown: "./global-teardown.ts",
  use: {
    baseURL: webUrl,
    locale: "fr-FR",
    extraHTTPHeaders: {
      "Accept-Language": "fr",
    },
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "pnpm exec tsx src/index.ts",
      cwd: path.join(repoRoot, "apps/api"),
      url: `${apiUrl}/health`,
      reuseExistingServer: !isCi,
      timeout: 120_000,
      env: mergeEnv(apiEnv),
    },
    {
      command: isCi
        ? "bash ../e2e/scripts/start-web.sh"
        : "pnpm build && bash ../e2e/scripts/start-web.sh",
      cwd: path.join(repoRoot, "apps/web"),
      url: webUrl,
      reuseExistingServer: !isCi,
      timeout: 180_000,
      env: mergeEnv({
        NODE_ENV: "production",
        HOSTNAME: "127.0.0.1",
        PORT: webPort,
        NEXT_PUBLIC_API_URL: apiUrl,
        NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN:
          process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "pk.e2e-placeholder",
      }),
    },
  ],
});
