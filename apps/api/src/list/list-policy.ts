/**
 * Business rules for POI list access. Roles come from `checkListAccess` (see `./utils`).
 */

/**
 * Effective role for a user on a list, as returned by `checkListAccess`:
 * `OWNER` (creator), collaborator roles from Prisma, or `VIEWER` for a `PUBLIC` list with no collaborator row.
 */
export type ListMemberRole = "OWNER" | "EDITOR" | "VIEWER" | "ADMIN";

/**
 * Whether the user has any access to the list (at least read).
 *
 * @param role — Result of `checkListAccess`; `null` means no access (often answered with 404 to avoid leaking existence).
 * @returns Type predicate: after `if (!hasListAccess(role)) return`, `role` is narrowed to {@link ListMemberRole}.
 */
export function hasListAccess(role: ListMemberRole | null): role is ListMemberRole {
  return role !== null;
}

/**
 * Whether the user may change list metadata or list content (POIs added to the list): EDITOR, ADMIN, OWNER.
 *
 * @param role — Non-null, typically after {@link hasListAccess}.
 */
export function canUpdateList(role: ListMemberRole): boolean {
  return ["EDITOR", "ADMIN", "OWNER"].includes(role);
}

/**
 * Whether the user may delete the list. Restricted to ADMIN and OWNER.
 *
 * @param role — Non-null, typically after {@link hasListAccess}.
 */
export function canDeleteList(role: ListMemberRole): boolean {
  return ["ADMIN", "OWNER"].includes(role);
}

/**
 * Whether the user may run nearby-POI queries in the context of a list (includes VIEWER).
 *
 * @param role — Non-null, typically after {@link hasListAccess}.
 */
export function canQueryNearbyListPois(role: ListMemberRole): boolean {
  return ["EDITOR", "ADMIN", "OWNER", "VIEWER"].includes(role);
}

/**
 * Whether the user may manage share tokens and edit-invite links (ADMIN, OWNER).
 *
 * @param role — Non-null, typically after an access guard equivalent to {@link hasListAccess}.
 */
export function canManageShareAndEditLinks(role: ListMemberRole): boolean {
  return ["ADMIN", "OWNER"].includes(role);
}

/**
 * Whether the user may invite, remove, or change collaborator roles (ADMIN, OWNER).
 *
 * @param role — Non-null, typically after {@link hasListAccess}.
 */
export function canManageCollaborators(role: ListMemberRole): boolean {
  return ["ADMIN", "OWNER"].includes(role);
}

/**
 * Whether the user is the list creator (`PoiList.createdBy`).
 *
 * @param createdBy — Value of `list.createdBy` (or equivalent).
 * @param userId — Current user id (`req.user.id`).
 */
export function isListOwner(createdBy: string, userId: string): boolean {
  return createdBy === userId;
}

/**
 * Whether the effective role is list owner (creator), not only a collaborator.
 * Example: an OWNER cannot "leave" the list like a normal collaborator.
 *
 * @param role — Role from `checkListAccess`, already non-null.
 */
export function isListOwnerRole(role: ListMemberRole): boolean {
  return role === "OWNER";
}
