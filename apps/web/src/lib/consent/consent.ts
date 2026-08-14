export const CONSENT_STORAGE_KEY = "nirby.cookie-consent";
export const CONSENT_VERSION = 1;

export type CookieConsentState = {
  version: typeof CONSENT_VERSION;
  sentry: boolean;
  decidedAt: string;
};

const listeners = new Set<() => void>();

let cachedRaw: string | null | undefined;
let cachedState: CookieConsentState | null = null;

export function subscribeConsent(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

export function readConsent(): CookieConsentState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (raw === cachedRaw) {
      return cachedState;
    }

    cachedRaw = raw;
    if (!raw) {
      cachedState = null;
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<CookieConsentState>;
    if (
      parsed.version !== CONSENT_VERSION ||
      typeof parsed.sentry !== "boolean" ||
      typeof parsed.decidedAt !== "string"
    ) {
      cachedState = null;
      return null;
    }

    cachedState = {
      version: CONSENT_VERSION,
      sentry: parsed.sentry,
      decidedAt: parsed.decidedAt,
    };
    return cachedState;
  } catch {
    cachedRaw = undefined;
    cachedState = null;
    return null;
  }
}

export function writeConsent(sentry: boolean): CookieConsentState {
  const state: CookieConsentState = {
    version: CONSENT_VERSION,
    sentry,
    decidedAt: new Date().toISOString(),
  };

  const raw = JSON.stringify(state);
  window.localStorage.setItem(CONSENT_STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedState = state;
  listeners.forEach((listener) => listener());
  return state;
}
