"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { getLocaleFromCookieString } from "@/lib/i18n/locale-from-cookie";
import enCommon from "@/lib/i18n/locales/en/common.json";
import frCommon from "@/lib/i18n/locales/fr/common.json";

const messages = {
  fr: frCommon,
  en: enCommon,
} as const;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const locale = getLocaleFromCookieString(typeof document === "undefined" ? "" : document.cookie);
  const t = messages[locale].globalError;

  return (
    <html lang={locale}>
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 font-sans">
        <h2 className="text-lg font-semibold">{t.title}</h2>
        <p className="text-muted-foreground text-center text-sm">{t.description}</p>
        <button
          type="button"
          className="rounded-md bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black"
          onClick={() => reset()}
        >
          {t.retry}
        </button>
      </body>
    </html>
  );
}
