"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { DEFAULT_SHELL_VIEW } from "../constants/shell.constants";
import { useShellMapModeUrl } from "../hooks/use-shell-map-mode-url";
import { useShellSearch, type ShellSearch } from "../hooks/use-shell-search";
import { useShellViewUrl } from "../hooks/use-shell-view-url";
import type { ShellView } from "../types/shell.types";

type ShellContextValue = ShellSearch & {
  view: ShellView;
  setView: (view: ShellView) => void;
  setViewAndExitMapMode: (view: ShellView) => void;
  mapMode: boolean;
  setMapMode: (value: boolean) => void;
};

const ShellContext = createContext<ShellContextValue | null>(null);

export function ShellProvider({ children }: { children: ReactNode }) {
  const [view, setViewState] = useState<ShellView>(DEFAULT_SHELL_VIEW);
  const [mapMode, setMapModeState] = useState(false);

  const { setView } = useShellViewUrl(view, setViewState);
  const { setMapMode } = useShellMapModeUrl(mapMode, setMapModeState);
  // Committing a search rewrites `view` and `mapMode` in the URL, and both hooks above
  // adopt those params, so switching to Explore needs no extra wiring here.
  const { query, searchDraft, setSearchDraft, setQuery } = useShellSearch();

  const setViewAndExitMapMode = useCallback(
    (next: ShellView) => {
      if (mapMode && next === view) {
        setMapMode(false);
        return;
      }
      setView(next);
    },
    [mapMode, view, setMapMode, setView]
  );

  const value = useMemo(
    () => ({
      view,
      setView,
      setViewAndExitMapMode,
      mapMode,
      setMapMode,
      query,
      searchDraft,
      setSearchDraft,
      setQuery,
    }),
    [
      view,
      setView,
      setViewAndExitMapMode,
      mapMode,
      setMapMode,
      query,
      searchDraft,
      setSearchDraft,
      setQuery,
    ]
  );

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used within ShellProvider");
  return ctx;
}
