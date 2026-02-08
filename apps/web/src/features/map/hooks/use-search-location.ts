import { useMap } from "@/features/map";

const MAP_CENTERED_ON_USER_THRESHOLD_METERS = 250;

export function getDistanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function useSearchLocation() {
  const { map, userPosition } = useMap();

  return () => {
    if (!map) return null;
    const center = map.getCenter();
    const centerCoords = { lat: center.lat, lng: center.lng };

    // If the user has a position, check if the map is centered on the user
    if (userPosition) {
      const distance = getDistanceMeters(centerCoords, userPosition);
      if (distance < MAP_CENTERED_ON_USER_THRESHOLD_METERS) {
        return userPosition;
      }
    }

    // If the user doesn't have a position, return the center of the map
    return centerCoords;
  };
}
