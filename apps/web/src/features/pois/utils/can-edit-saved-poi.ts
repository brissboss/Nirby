import type { SavedPoiListItem } from "../types/poi-display-types";

/** Whether the current user may edit this saved POI (custom place they created). */
export function canEditSavedPoi(savedPoi: SavedPoiListItem, userId: string | undefined): boolean {
  return Boolean(userId && savedPoi.poi?.id && savedPoi.poi.createdBy === userId);
}
