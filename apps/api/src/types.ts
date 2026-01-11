/**
 * Supported languages for the application
 */
export const SUPPORTED_LANGUAGES = ["fr", "en"] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const POI_CATEGORIES = [
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

export type PoiCategory = (typeof POI_CATEGORIES)[number];
