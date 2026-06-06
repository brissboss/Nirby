import type {
  GooglePlace,
  OpeningHoursPeriod,
  Poi,
  PoiDisplayData,
  PoiOpeningHours,
  PoiPhoto,
  PoiSource,
  SavedPoiListItem,
} from "../types/poi-display-types";

import { computeOpeningStatusFromPeriods } from "./compute-opening-status";

function extractPhotoFromPoi(poi: Poi): PoiPhoto | null {
  const url = poi.photoUrls?.[0]?.trim();
  return url ? { kind: "url", url } : null;
}

function extractPhotoFromGoogle(place: GooglePlace): PoiPhoto | null {
  const ref = place.photoReferences?.[0]?.trim();
  return ref ? { kind: "google-ref", photoRef: ref } : null;
}

function extractOpeningHours(raw: unknown): PoiOpeningHours | null {
  if (!raw) return null;

  // Google: { openNow, nextOpenTime, periods }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;

    if (typeof obj.openNow === "boolean") {
      return {
        isOpen: obj.openNow,
        nextOpenAt: typeof obj.nextOpenTime === "string" ? obj.nextOpenTime : null,
      };
    }
  }

  // Custom POI: [{ open, close }]
  if (Array.isArray(raw) && raw.length > 0) {
    return computeOpeningStatusFromPeriods(raw as OpeningHoursPeriod[]);
  }

  return null;
}

function buildDisplayData(input: {
  id: string;
  name: string;
  address: string | null;
  category: string | null;
  source: PoiSource;
  photo: PoiPhoto | null;
  openingHours: PoiOpeningHours | null;
}): PoiDisplayData {
  return {
    id: input.id,
    name: input.name.trim() || "Untitled place",
    address: input.address?.trim() || null,
    category: input.category?.trim() || null,
    source: input.source,
    photo: input.photo,
    openingHours: input.openingHours,
  };
}

export function getPoiDisplayDataFromPoi(poi: Poi, id?: string): PoiDisplayData | null {
  if (!poi.name?.trim() && !poi.id) return null;

  return buildDisplayData({
    id: id ?? poi.id ?? "",
    name: poi.name?.trim() || "Untitled place",
    address: poi.address ?? null,
    category: poi.category ?? null,
    source: "custom",
    photo: extractPhotoFromPoi(poi),
    openingHours: extractOpeningHours(poi.openingHours),
  });
}

export function getPoiDisplayDataFromGooglePlace(
  place: GooglePlace,
  id?: string
): PoiDisplayData | null {
  if (!place.name?.trim() && !place.placeId) return null;

  return buildDisplayData({
    id: id ?? place.placeId ?? "",
    name: place.name?.trim() || "Untitled place",
    address: place.address ?? null,
    category: place.categoryDisplayName ?? place.category ?? null,
    source: "google",
    photo: extractPhotoFromGoogle(place),
    openingHours: extractOpeningHours(place.openingHours),
  });
}

export function getPoiDisplayDataFromSavedPoi(savedPoi: SavedPoiListItem): PoiDisplayData | null {
  if (savedPoi.googlePlaceCache) {
    return getPoiDisplayDataFromGooglePlace(
      savedPoi.googlePlaceCache,
      savedPoi.id ?? savedPoi.googlePlaceCache.placeId
    );
  }

  if (savedPoi.poi) {
    return getPoiDisplayDataFromPoi(savedPoi.poi, savedPoi.id ?? savedPoi.poi.id);
  }

  return null;
}
