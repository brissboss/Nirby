"use client";

import { PoiCard, getPoiDisplayDataFromSavedPoi, type SavedPoiListItem } from "@/features/pois";

type ListPoiRowProps = {
  savedPoi: SavedPoiListItem;
};

export function ListPoiRow({ savedPoi }: ListPoiRowProps) {
  const display = getPoiDisplayDataFromSavedPoi(savedPoi);

  if (!display) {
    return null;
  }

  return <PoiCard poi={display} />;
}
