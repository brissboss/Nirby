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
