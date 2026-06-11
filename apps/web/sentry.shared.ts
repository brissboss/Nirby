import type { BrowserOptions } from "@sentry/nextjs";

export const sentrySharedOptions: BrowserOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  enabled: process.env.NODE_ENV !== "development" && !!process.env.NEXT_PUBLIC_SENTRY_DSN,
};
