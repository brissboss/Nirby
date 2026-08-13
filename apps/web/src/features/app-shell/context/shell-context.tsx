"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

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
  selectedPoiId: string | null;
  selectPoi: (id: string) => void;
  clearSelection: () => void;
};

const ShellContext = createContext<ShellContextValue | null>(null);

export function ShellProvider({ children }: { children: ReactNode }) {
  const [view, setViewState] = useState<ShellView>(DEFAULT_SHELL_VIEW);
  const [mapMode, setMapModeState] = useState(false);
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);

  const { setView } = useShellViewUrl(view, setViewState);
  const { setMapMode } = useShellMapModeUrl(mapMode, setMapModeState);
  // Committing a search rewrites `view` and `mapMode` in the URL, and both hooks above
  // adopt those params, so switching to Explore needs no extra wiring here.
  const { query, searchDraft, setSearchDraft, setQuery } = useShellSearch();

  const prevQueryRef = useRef(query);

  useEffect(() => {
    if (query !== prevQueryRef.current) {
      prevQueryRef.current = query;
      setSelectedPoiId(null);
    }
  }, [query]);

  const clearSelection = useCallback(() => {
    setSelectedPoiId(null);
    setMapMode(false);
  }, [setMapMode]);

  const selectPoi = useCallback(
    (id: string) => {
      setSelectedPoiId(id);
      setMapMode(true);
    },
    [setMapMode]
  );

  const setViewWithClear = useCallback(
    (next: ShellView) => {
      setSelectedPoiId(null);
      setView(next);
    },
    [setView]
  );

  const setViewAndExitMapMode = useCallback(
    (next: ShellView) => {
      if (mapMode && next === view) {
        clearSelection();
        return;
      }
      setSelectedPoiId(null);
      setView(next);
    },
    [mapMode, view, clearSelection, setView]
  );

  const value = useMemo(
    () => ({
      view,
      setView: setViewWithClear,
      setViewAndExitMapMode,
      mapMode,
      setMapMode,
      selectedPoiId,
      selectPoi,
      clearSelection,
      query,
      searchDraft,
      setSearchDraft,
      setQuery,
    }),
    [
      view,
      setViewWithClear,
      setViewAndExitMapMode,
      mapMode,
      setMapMode,
      selectedPoiId,
      selectPoi,
      clearSelection,
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
