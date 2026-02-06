/**
 * The search results markers utils.
 */

export const SEARCH_RESULTS_SOURCE_ID = "search-results";
export const SEARCH_RESULTS_LAYER_ID = "search-results-layer";

export const SEARCH_RESULTS_LAYER_PAINT = {
  "circle-radius": 8,
  "circle-stroke-width": 2,
  "circle-stroke-color": "#fff",
  "circle-opacity": 1,
} as const;

export const SEARCH_RESULTS_FIT_BOUNDS_OPTIONS = {
  padding: 40,
  maxZoom: 15,
  duration: 800,
} as const;

export const FLY_TO_SELECTED_OPTIONS = {
  zoom: 14,
  duration: 800,
} as const;

type PlaceWithCoords = {
  placeId?: string | null;
  longitude: number;
  latitude: number;
};

/**
 * Converts an array of places to a GeoJSON feature collection.
 * @param places - The places to convert to GeoJSON.
 * @returns A GeoJSON feature collection.
 * @example
 * ```ts
 * const geojson = placesToGeoJSON([{ longitude: 0, latitude: 0 }, { longitude: 1, latitude: 1 }]);
 * console.log(geojson);
 * // { type: "FeatureCollection", features: [{ type: "Feature", geometry: { type: "Point", coordinates: [0, 0] }, properties: { placeId: "" } }, { type: "Feature", geometry: { type: "Point", coordinates: [1, 1] }, properties: { placeId: "" } }] }
 * ```
 */
export function placesToGeoJSON(
  places: PlaceWithCoords[]
): GeoJSON.FeatureCollection<GeoJSON.Point, { placeId: string }> {
  return {
    type: "FeatureCollection",
    features: places.map((p) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [p.longitude, p.latitude],
      },
      properties: { placeId: p.placeId ?? "" },
    })),
  };
}

/**
 *
 * @param places - The places to compute the bounds for.
 * @returns The bounds of the places.
 * @example
 * ```ts
 * const bounds = computeBounds([{ longitude: 0, latitude: 0 }, { longitude: 1, latitude: 1 }]);
 * console.log(bounds);
 * // [[0, 0], [1, 1]]
 * ```
 */
export function computeBounds(places: PlaceWithCoords[]): [[number, number], [number, number]] {
  const lngs = places.map((p) => p.longitude);
  const lats = places.map((p) => p.latitude);
  let minLng = Math.min(...lngs);
  let maxLng = Math.max(...lngs);
  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  if (minLng === maxLng && minLat === maxLat) {
    const d = 0.005;
    minLng -= d;
    maxLng += d;
    minLat -= d;
    maxLat += d;
  }
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}
