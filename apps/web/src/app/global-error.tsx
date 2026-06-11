"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

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

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 font-sans">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground text-center text-sm">
          An unexpected error occurred. Please try again.
        </p>
        <button
          type="button"
          className="rounded-md bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black"
          onClick={() => reset()}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
