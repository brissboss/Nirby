import * as Sentry from "@sentry/nextjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { applySentryConsent, initClientSentryIfAllowed } from "./apply-sentry-consent";
import { CONSENT_STORAGE_KEY, writeConsent } from "./consent";

vi.mock("@sentry/nextjs", () => ({
  init: vi.fn(),
  close: vi.fn(),
  getClient: vi.fn(),
}));

describe("apply sentry consent", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(Sentry.getClient).mockReturnValue(undefined);
  });

  it("does not init Sentry when consent is missing or refused", () => {
    initClientSentryIfAllowed();
    expect(Sentry.init).not.toHaveBeenCalled();

    writeConsent(false);
    initClientSentryIfAllowed();
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it("inits Sentry when consent is granted and no client exists", () => {
    writeConsent(true);
    initClientSentryIfAllowed();
    expect(Sentry.init).toHaveBeenCalledOnce();
  });

  it("does not init again when a client already exists", () => {
    writeConsent(true);
    vi.mocked(Sentry.getClient).mockReturnValue({} as ReturnType<typeof Sentry.getClient>);
    initClientSentryIfAllowed();
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it("closes Sentry when consent is revoked", () => {
    applySentryConsent(false);
    expect(Sentry.close).toHaveBeenCalled();
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it("inits Sentry when applySentryConsent(true) follows a stored accept", () => {
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ version: 1, sentry: true, decidedAt: "2026-08-14T15:00:00.000Z" })
    );
    applySentryConsent(true);
    expect(Sentry.init).toHaveBeenCalledOnce();
  });
});
