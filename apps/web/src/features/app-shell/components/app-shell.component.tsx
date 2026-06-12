"use client";

import { ComponentType, Suspense } from "react";

import { ShellProvider } from "../context/shell-context";
import { ShellView } from "../types/shell.types";

import { DesktopShell } from "./desktop/desktop-shell.component";
import { MobileShell } from "./mobile/mobile-shell.component";
import { ShellOverlay } from "./shared/shell-overlay.component";

type AppShellProps = {
  viewComponents: Record<ShellView, ComponentType>;
};

export function AppShell({ viewComponents }: AppShellProps) {
  return (
    <Suspense fallback={null}>
      <ShellProvider>
        <ShellOverlay>
          <DesktopShell viewComponents={viewComponents} />
          <MobileShell viewComponents={viewComponents} />
        </ShellOverlay>
      </ShellProvider>
    </Suspense>
  );
}
