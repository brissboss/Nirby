import type { ProfileSection } from "../types/profile-section.types";

import {
  LIST_ID_PARAM,
  PROFILE_SECTION_PARAM,
  SHELL_MAP_MODE_PARAM,
  SHELL_VIEW_PARAM,
} from "@/lib/navigation/search-params";

/** Re-export for hooks/views that import from profile.constants. */
export { PROFILE_SECTION_PARAM } from "@/lib/navigation/search-params";

export const DEFAULT_PROFILE_SECTION: ProfileSection = "hub";

const PROFILE_SECTION_IDS = [
  "hub",
  "info",
  "preferences",
  "privacy",
  "changePassword",
  "deleteAccount",
] as const satisfies readonly ProfileSection[];

export function isProfileSection(value: string | null): value is ProfileSection {
  return value !== null && (PROFILE_SECTION_IDS as readonly string[]).includes(value);
}

export function parseProfileSection(raw: string | null): ProfileSection {
  return isProfileSection(raw) ? raw : DEFAULT_PROFILE_SECTION;
}

export function buildProfileSectionSearchParams(
  current: URLSearchParams,
  section: ProfileSection
): string {
  const next = new URLSearchParams(current.toString());

  next.set(SHELL_VIEW_PARAM, "profile");

  if (section === DEFAULT_PROFILE_SECTION) {
    next.delete(PROFILE_SECTION_PARAM);
  } else {
    next.set(PROFILE_SECTION_PARAM, section);
  }

  next.delete(LIST_ID_PARAM);
  next.delete(SHELL_MAP_MODE_PARAM);

  const qs = next.toString();
  return qs ? `?${qs}` : "";
}
