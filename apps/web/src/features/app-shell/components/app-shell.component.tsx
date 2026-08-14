"use client";

import { ComponentType, Suspense } from "react";

import { ShellProvider } from "../context/shell-context";
import { ShellView } from "../types/shell.types";

import { DesktopShell } from "./desktop/desktop-shell.component";
import { MobileShell } from "./mobile/mobile-shell.component";
import { ShellOverlay } from "./shared/shell-overlay.component";

import { MAIN_CONTENT_ID } from "@/lib/a11y/landmarks";

type AppShellProps = {
  viewComponents: Record<ShellView, ComponentType>;
};

export function AppShell({ viewComponents }: AppShellProps) {
  return (
    <Suspense fallback={null}>
      <ShellProvider>
        <ShellOverlay>
          <main id={MAIN_CONTENT_ID} tabIndex={-1} className="h-full">
            <DesktopShell viewComponents={viewComponents} />
            <MobileShell viewComponents={viewComponents} />
          </main>
        </ShellOverlay>
      </ShellProvider>
    </Suspense>
  );
}
