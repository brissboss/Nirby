"use client";

import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";

import { useMap } from "../context";
import { getMapPoiBounds } from "../utils/map-bounds";

import type { MapPoi } from "@/features/pois";

type PoiMarkersLayerProps = {
  pois: MapPoi[];
};

function getPoisKey(pois: MapPoi[]): string {
  return pois.map((poi) => `${poi.id}:${poi.lat}:${poi.lng}`).join("|");
}

export function PoiMarkersLayer({ pois }: PoiMarkersLayerProps) {
  const { map } = useMap();
  const poisRef = useRef(pois);
  const poisKey = getPoisKey(pois);
  poisRef.current = pois;

  useEffect(() => {
    if (!map) return;

    const currentPois = poisRef.current;
    const markers = currentPois.map((poi) => {
      const marker = new mapboxgl.Marker().setLngLat([poi.lng, poi.lat]);

      if (poi.label) {
        marker.setPopup(new mapboxgl.Popup({ closeButton: false }).setText(poi.label));
      }

      return marker.addTo(map);
    });

    const bounds = getMapPoiBounds(currentPois);
    if (bounds) {
      map.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 800 });
    }

    return () => {
      markers.forEach((marker) => marker.remove());
    };
  }, [map, poisKey]);

  return null;
}
