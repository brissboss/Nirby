import type { Poi } from "@prisma/client";

/**
 * Business rules for standalone POIs (outside shared-list context).
 */

/**
 * Whether the user may read a POI: always the creator; otherwise only if visibility is `PUBLIC`.
 * `PRIVATE` and `SHARED` do not grant read access to non-creators under this rule.
 *
 * @param poi — Entity or subset with `createdBy` and `visibility`.
 * @param userId — Authenticated user id.
 */
export function canReadPoi(poi: Pick<Poi, "createdBy" | "visibility">, userId: string): boolean {
  return poi.createdBy === userId || poi.visibility === "PUBLIC";
}

/**
 * Whether the user may update a POI (fields, visibility, etc.): creator only.
 *
 * @param poi — At least `createdBy` (sufficient for the decision).
 * @param userId — Authenticated user id.
 */
export function canEditPoi(poi: Pick<Poi, "createdBy">, userId: string): boolean {
  return poi.createdBy === userId;
}

/**
 * Whether the user may delete a POI: same as {@link canEditPoi} (creator only).
 *
 * @param poi — At least `createdBy`.
 * @param userId — Authenticated user id.
 */
export function canDeletePoi(poi: Pick<Poi, "createdBy">, userId: string): boolean {
  return poi.createdBy === userId;
}
