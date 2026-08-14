/** Field limits for POI create — mirrors POST /poi validation. */
export const poiConstraints = {
  name: { min: 1, max: 255 },
  description: { max: 1000 },
  address: { max: 500 },
  latitude: { min: -90, max: 90 },
  longitude: { min: -180, max: 180 },
} as const;

export const POI_VISIBILITY_VALUES = ["PRIVATE", "SHARED", "PUBLIC"] as const;

export type PoiVisibility = (typeof POI_VISIBILITY_VALUES)[number];

export const DEFAULT_POI_VISIBILITY: PoiVisibility = "PRIVATE";

/** Mirrors API `POI_CATEGORIES` in `apps/api/src/types.ts`. */
export const POI_CATEGORY_VALUES = [
  "restaurant",
  "cafe",
  "bar",
  "bakery",
  "grocery_store",
  "supermarket",
  "hotel",
  "museum",
  "park",
  "gym",
  "pharmacy",
  "hospital",
  "bank",
  "gas_station",
  "parking",
  "shopping_mall",
  "movie_theater",
  "library",
  "church",
  "mosque",
  "school",
  "university",
  "train_station",
  "bus_station",
  "airport",
  "tourist_attraction",
  "other",
] as const;

export type PoiCategory = (typeof POI_CATEGORY_VALUES)[number];
