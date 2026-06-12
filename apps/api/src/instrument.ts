import * as Sentry from "@sentry/node";

const dsn = process.env.SENTRY_DSN;

if (dsn && process.env.NODE_ENV !== "test") {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    beforeSend(event) {
      const url = event.request?.url ?? "";
      if (url.includes("/health") || url.includes("/ready")) {
        return null;
      }
      return event;
    },
  });
}

export { Sentry };
