import type { GooglePlaceCache, Poi, SavedPoi } from "@prisma/client";

import { getOrFetchPlace } from "./service";

export type SavedPoiWithGoogleCache = SavedPoi & {
  poi: Poi | null;
  googlePlaceCache: GooglePlaceCache | null;
};

export async function hydrateExpiredGooglePlaceCaches<T extends SavedPoiWithGoogleCache>(
  savedPois: T[],
  language = "en-US"
): Promise<T[]> {
  const now = new Date();
  const expiredPlaceIds = [
    ...new Set(
      savedPois
        .filter(
          (savedPoi) =>
            savedPoi.googlePlaceCache &&
            (!savedPoi.googlePlaceCache.expiresAt || savedPoi.googlePlaceCache.expiresAt <= now)
        )
        .map((savedPoi) => savedPoi.googlePlaceCache!.placeId)
    ),
  ];

  if (expiredPlaceIds.length === 0) {
    return savedPois;
  }

  const refreshedEntries = await Promise.all(
    expiredPlaceIds.map(async (placeId) => {
      const refreshed = await getOrFetchPlace(placeId, language);
      return [placeId, refreshed] as const;
    })
  );
  const refreshedByPlaceId = new Map(refreshedEntries);

  return savedPois.map((savedPoi) => {
    if (!savedPoi.googlePlaceCache) {
      return savedPoi;
    }

    const refreshed = refreshedByPlaceId.get(savedPoi.googlePlaceCache.placeId);
    return refreshed ? { ...savedPoi, googlePlaceCache: refreshed } : savedPoi;
  });
}
