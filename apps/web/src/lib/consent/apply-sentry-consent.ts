import * as Sentry from "@sentry/nextjs";

import { sentrySharedOptions } from "../../../sentry.shared";

import { readConsent } from "./consent";

export function initClientSentryIfAllowed() {
  if (typeof window === "undefined") {
    return;
  }

  if (!readConsent()?.sentry) {
    return;
  }

  if (Sentry.getClient()) {
    return;
  }

  Sentry.init(sentrySharedOptions);
}

export function applySentryConsent(sentry: boolean) {
  if (sentry) {
    initClientSentryIfAllowed();
    return;
  }

  void Sentry.close();
}
