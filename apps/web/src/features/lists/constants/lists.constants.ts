import { ListsSection } from "../types/lists-section.types";

import {
  LIST_ID_PARAM,
  SHELL_MAP_MODE_PARAM,
  SHELL_VIEW_PARAM,
} from "@/lib/navigation/search-params";

/** Re-export for hooks/views that import from lists.constants. */
export { LIST_ID_PARAM } from "@/lib/navigation/search-params";

export const DEFAULT_LISTS_SECTION: ListsSection = "index";
/**
 * Parses `listId` from the URL.
 * Index is represented by `null` (param absent or empty).
 */
export function parseListId(raw: string | null): string | null {
  if (raw === null || raw === "") {
    return null;
  }
  return raw;
}
/**
 * Builds the query string when navigating within the lists shell.
 *
 * - Always sets `view=lists`
 * - Sets `listId` for detail, removes it for index
 * - Clears `mapMode` (same as profile navigation)
 */
export function buildListsNavigationSearchParams(
  current: URLSearchParams,
  listId: string | null
): string {
  const next = new URLSearchParams(current.toString());
  next.set(SHELL_VIEW_PARAM, "lists");
  if (listId === null) {
    next.delete(LIST_ID_PARAM);
  } else {
    next.set(LIST_ID_PARAM, listId);
  }
  next.delete(SHELL_MAP_MODE_PARAM);
  const qs = next.toString();
  return qs ? `?${qs}` : "";
}

/** Field limits for list create/update — mirrors POST/PUT /list validation. */
export const listConstraints = {
  name: { min: 1, max: 255 },
  description: { max: 1000 },
} as const;

export const LIST_VISIBILITY_VALUES = ["PRIVATE", "SHARED", "PUBLIC"] as const;

export type ListVisibility = (typeof LIST_VISIBILITY_VALUES)[number];

export const DEFAULT_LIST_VISIBILITY: ListVisibility = "PRIVATE";

/** Collaborator / owner roles that may edit list metadata (mirrors API `canUpdateList`). */
export const EDITABLE_LIST_ROLES = ["OWNER", "ADMIN", "EDITOR"] as const;

/** Collaborator / owner roles that may delete a list (mirrors API `canDeleteList`). */
export const DELETABLE_LIST_ROLES = ["OWNER", "ADMIN"] as const;

/** Roles that may manage share tokens and edit-invite links (mirrors API `canManageShareAndEditLinks`). */
export const SHARE_MANAGE_ROLES = ["OWNER", "ADMIN"] as const;

/** Roles that may invite, remove, or change collaborator roles (mirrors API `canManageCollaborators`). */
export const COLLABORATOR_MANAGE_ROLES = ["OWNER", "ADMIN"] as const;

export type ListRole = (typeof EDITABLE_LIST_ROLES)[number] | "VIEWER";

/**
 * Whether the current user may delete the list.
 * EDITOR, VIEWER and missing role → no delete.
 */
export function canDeleteList(role?: ListRole): boolean {
  return (
    role !== undefined &&
    DELETABLE_LIST_ROLES.includes(role as (typeof DELETABLE_LIST_ROLES)[number])
  );
}

/**
 * Whether the current user may edit list fields (name, description, visibility).
 * VIEWER and missing role → read-only.
 */
export function canEditList(role?: ListRole): boolean {
  return (
    role !== undefined && EDITABLE_LIST_ROLES.includes(role as (typeof EDITABLE_LIST_ROLES)[number])
  );
}

/**
 * Whether the current user may manage share tokens and edit-invite links.
 * EDITOR, VIEWER and missing role → no share management.
 */
export function canManageShareAndEditLinks(role?: ListRole): boolean {
  return (
    role !== undefined && SHARE_MANAGE_ROLES.includes(role as (typeof SHARE_MANAGE_ROLES)[number])
  );
}

/**
 * Whether the current user may invite, remove, or change collaborator roles.
 * EDITOR, VIEWER and missing role → no collaborator management.
 */
export function canManageCollaborators(role?: ListRole): boolean {
  return (
    role !== undefined &&
    COLLABORATOR_MANAGE_ROLES.includes(role as (typeof COLLABORATOR_MANAGE_ROLES)[number])
  );
}
