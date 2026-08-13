import type { GooglePlace, MapPoi, Poi, SavedPoiListItem } from "../types/poi-display-types";

function parseCoordinates(
  lat: number | undefined,
  lng: number | undefined
): { lat: number; lng: number } | null {
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
}

function toMapPoi(id: string, lat: number, lng: number, name?: string | null): MapPoi {
  const label = name?.trim();
  return label ? { id, lat, lng, label } : { id, lat, lng };
}

export function getCoordinatesFromGooglePlace(place: GooglePlace): MapPoi | null {
  const coords = parseCoordinates(place.latitude, place.longitude);
  if (!coords) return null;

  return toMapPoi(place.placeId ?? "", coords.lat, coords.lng, place.name);
}

function getCoordinatesFromPoi(poi: Poi, id: string): MapPoi | null {
  const coords = parseCoordinates(poi.latitude, poi.longitude);
  if (!coords) return null;

  return toMapPoi(id, coords.lat, coords.lng, poi.name);
}

export function getCoordinatesFromSavedPoi(savedPoi: SavedPoiListItem): MapPoi | null {
  if (savedPoi.googlePlaceCache) {
    const fromCache = getCoordinatesFromGooglePlace(savedPoi.googlePlaceCache);
    if (fromCache) {
      return {
        ...fromCache,
        id: savedPoi.id ?? savedPoi.googlePlaceCache.placeId ?? fromCache.id,
      };
    }
  }

  if (savedPoi.poi) {
    return getCoordinatesFromPoi(savedPoi.poi, savedPoi.id ?? savedPoi.poi.id ?? "");
  }

  return null;
}
