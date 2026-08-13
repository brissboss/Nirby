import type { MapPoi } from "@/features/pois";

export function getMapPoiBounds(pois: MapPoi[]): [[number, number], [number, number]] | null {
  if (pois.length === 0) return null;

  let minLng = pois[0].lng;
  let minLat = pois[0].lat;
  let maxLng = pois[0].lng;
  let maxLat = pois[0].lat;

  for (const poi of pois) {
    if (poi.lng < minLng) minLng = poi.lng;
    if (poi.lat < minLat) minLat = poi.lat;
    if (poi.lng > maxLng) maxLng = poi.lng;
    if (poi.lat > maxLat) maxLat = poi.lat;
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}
