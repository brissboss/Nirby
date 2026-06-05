"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ListFormLayoutProps = {
  embedded?: boolean;
  children: ReactNode;
};

/** Outer shell spacing for embedded (shell) vs standalone list forms. */
export function ListFormLayout({ embedded = false, children }: ListFormLayoutProps) {
  return (
    <div className={cn(!embedded && "pt-4")}>
      <div
        className={cn(
          "grid gap-6",
          !embedded && "py-4 md:py-0 mb-[env(safe-area-inset-bottom,0.5rem)]"
        )}
      >
        {children}
      </div>
    </div>
  );
}
