"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { useShellMapModeUrl } from "../hooks/use-shell-map-mode-url";
import { useShellViewUrl } from "../hooks/use-shell-view-url";
import type { ShellView } from "../types/shell.types";

type ShellContextValue = {
  view: ShellView;
  setView: (view: ShellView) => void;
  setViewAndExitMapMode: (view: ShellView) => void;
  mapMode: boolean;
  setMapMode: (value: boolean) => void;
};

const ShellContext = createContext<ShellContextValue | null>(null);

export function ShellProvider({ children }: { children: ReactNode }) {
  const [view, setViewState] = useState<ShellView>("explore");
  const [mapMode, setMapModeState] = useState(false);

  const { setView } = useShellViewUrl(view, setViewState);
  const { setMapMode } = useShellMapModeUrl(mapMode, setMapModeState);

  const setViewAndExitMapMode = useCallback(
    (next: ShellView) => {
      setView(next);
      setMapMode(false);
    },
    [setView, setMapMode]
  );

  const value = useMemo(
    () => ({
      view,
      setView,
      setViewAndExitMapMode,
      mapMode,
      setMapMode,
    }),
    [view, setView, setViewAndExitMapMode, mapMode, setMapMode]
  );

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used within ShellProvider");
  return ctx;
}
