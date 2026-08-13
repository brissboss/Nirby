import { Compass, ListChecks, User } from "lucide-react";

import type { ShellView, ShellViewConfig } from "../types/shell.types";

import {
  EXPLORE_QUERY_PARAM,
  LIST_ID_PARAM,
  PROFILE_SECTION_PARAM,
  SHELL_MAP_MODE_PARAM,
  SHELL_VIEW_PARAM,
} from "@/lib/navigation/search-params";

/** Re-export for callers that still import from app-shell (e.g. `use-shell-view-url`). */
export { SHELL_VIEW_PARAM } from "@/lib/navigation/search-params";

export const SHELL_VIEWS = [
  { id: "explore", icon: Compass },
  { id: "lists", icon: ListChecks },
  { id: "profile", icon: User },
] as const satisfies readonly ShellViewConfig[];

export const MOBILE_SHEET_HEIGHT = "80dvh";

export const MOBILE_CHROME_BOTTOM_EXPANDED = `calc(${MOBILE_SHEET_HEIGHT} + env(safe-area-inset-bottom))`;
export const MOBILE_CHROME_BOTTOM_MAP_MODE = "calc(4.5rem + env(safe-area-inset-bottom))";

export const DEFAULT_SHELL_VIEW: ShellView = "explore";

/** Minimum characters before a search query triggers Google Places and switches to Explore. */
export const EXPLORE_MIN_QUERY_LENGTH = 2;

/** Debounce delay for the global search box input (ms). */
export const EXPLORE_SEARCH_DEBOUNCE_MS = 400;

const SHELL_VIEW_IDS = ["explore", "lists", "profile"] as const satisfies readonly ShellView[];

export function isShellView(value: string | null): value is ShellView {
  return value !== null && (SHELL_VIEW_IDS as readonly string[]).includes(value);
}

export function parseShellView(raw: string | null): ShellView {
  return isShellView(raw) ? raw : DEFAULT_SHELL_VIEW;
}

export function parseShellMapMode(raw: string | null): boolean {
  return raw === "1";
}

export function parseShellQuery(raw: string | null): string {
  return raw?.trim() ?? "";
}

export function buildShellMapModeSearchParams(current: URLSearchParams, mapMode: boolean): string {
  const next = new URLSearchParams(current.toString());

  if (mapMode) {
    next.set(SHELL_MAP_MODE_PARAM, "1");
  } else {
    next.delete(SHELL_MAP_MODE_PARAM);
  }

  const qs = next.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Builds the query string when the explore search query changes.
 *
 * - Sets or removes `q`
 * - When the query reaches {@link EXPLORE_MIN_QUERY_LENGTH}, switches to Explore
 *   (default view — `view` param omitted) and clears profile/lists/mapMode params
 */
export function buildShellQuerySearchParams(current: URLSearchParams, query: string): string {
  const next = new URLSearchParams(current.toString());

  if (query) {
    next.set(EXPLORE_QUERY_PARAM, query);
  } else {
    next.delete(EXPLORE_QUERY_PARAM);
  }

  if (query.length >= EXPLORE_MIN_QUERY_LENGTH) {
    next.delete(SHELL_VIEW_PARAM);
    next.delete(PROFILE_SECTION_PARAM);
    next.delete(LIST_ID_PARAM);
    next.delete(SHELL_MAP_MODE_PARAM);
  }

  const qs = next.toString();
  return qs ? `?${qs}` : "";
}

export function buildShellViewSearchParams(current: URLSearchParams, view: ShellView): string {
  const next = new URLSearchParams(current.toString());

  if (view === DEFAULT_SHELL_VIEW) {
    next.delete(SHELL_VIEW_PARAM);
  } else {
    next.set(SHELL_VIEW_PARAM, view);
  }

  if (view !== "profile") {
    next.delete(PROFILE_SECTION_PARAM);
  }

  if (view !== "lists") {
    next.delete(LIST_ID_PARAM);
  }

  next.delete(SHELL_MAP_MODE_PARAM);

  const qs = next.toString();
  return qs ? `?${qs}` : "";
}
