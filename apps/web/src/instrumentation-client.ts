import * as Sentry from "@sentry/nextjs";

import { initClientSentryIfAllowed } from "@/lib/consent/apply-sentry-consent";

initClientSentryIfAllowed();

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
