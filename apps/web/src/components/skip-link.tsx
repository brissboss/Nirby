import type { ReactNode } from "react";

import { MAIN_CONTENT_ID } from "@/lib/a11y/landmarks";

type SkipLinkProps = {
  children: ReactNode;
};

export function SkipLink({ children }: SkipLinkProps) {
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-popover focus:rounded-md focus:bg-background focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-lg focus:ring-2 focus:ring-ring focus:outline-none"
    >
      {children}
    </a>
  );
}
