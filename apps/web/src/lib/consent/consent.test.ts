import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { CONSENT_STORAGE_KEY, CONSENT_VERSION, readConsent, writeConsent } from "./consent";

describe("cookie consent storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("returns null when nothing is stored", () => {
    expect(readConsent()).toBeNull();
  });

  it("returns null for invalid JSON or an unexpected version", () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, "{");
    expect(readConsent()).toBeNull();

    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ version: 99, sentry: true, decidedAt: "2026-01-01T00:00:00.000Z" })
    );
    expect(readConsent()).toBeNull();
  });

  it("writes accept and refuse with an ISO decidedAt and reads them back", () => {
    const accepted = writeConsent(true);

    expect(accepted).toEqual({
      version: CONSENT_VERSION,
      sentry: true,
      decidedAt: accepted.decidedAt,
    });
    expect(accepted.decidedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(readConsent()).toEqual(accepted);

    const refused = writeConsent(false);
    expect(refused.sentry).toBe(false);
    expect(readConsent()?.sentry).toBe(false);
    expect(readConsent()?.decidedAt).toBe(refused.decidedAt);
  });
});
