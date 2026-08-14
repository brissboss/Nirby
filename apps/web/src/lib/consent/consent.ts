export const CONSENT_STORAGE_KEY = "nirby.cookie-consent";
export const CONSENT_VERSION = 1;

export type CookieConsentState = {
  version: typeof CONSENT_VERSION;
  sentry: boolean;
  decidedAt: string;
};

export function readConsent(): CookieConsentState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<CookieConsentState>;
    if (
      parsed.version !== CONSENT_VERSION ||
      typeof parsed.sentry !== "boolean" ||
      typeof parsed.decidedAt !== "string"
    ) {
      return null;
    }

    return {
      version: CONSENT_VERSION,
      sentry: parsed.sentry,
      decidedAt: parsed.decidedAt,
    };
  } catch {
    return null;
  }
}

export function writeConsent(sentry: boolean): CookieConsentState {
  const state: CookieConsentState = {
    version: CONSENT_VERSION,
    sentry,
    decidedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
  return state;
}
