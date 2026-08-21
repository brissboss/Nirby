import { test as base } from "@playwright/test";

const CONSENT_STORAGE_KEY = "nirby.cookie-consent";

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript((key: string) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          sentry: false,
          decidedAt: "2026-01-01T00:00:00.000Z",
        })
      );
    }, CONSENT_STORAGE_KEY);
    await use(page);
  },
});

export { expect } from "@playwright/test";
