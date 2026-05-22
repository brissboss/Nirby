import { Compass, ListChecks, User } from "lucide-react";

import type { ShellView, ShellViewConfig } from "../types/shell.types";

import {
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

  next.delete(SHELL_MAP_MODE_PARAM);

  const qs = next.toString();
  return qs ? `?${qs}` : "";
}
