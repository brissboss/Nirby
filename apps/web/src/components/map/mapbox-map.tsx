"use client";

import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";

import { useMap } from "@/lib/map/context";

export function MapboxMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const { setMap, setGeolocateControl } = useMap();

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

    mapInstance.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/brissboss/cmkjlj49a002x01qu8yqn584l",
      center: [2.3522, 48.8566],
      zoom: 13,
    });

    const geolocateControl = new mapboxgl.GeolocateControl({
      trackUserLocation: true,
      showUserHeading: false,
      showAccuracyCircle: false,
      showButton: false,
      positionOptions: {
        enableHighAccuracy: true,
      },
    });

    mapInstance.current.addControl(geolocateControl);

    mapInstance.current.on("load", () => {
      setMap(mapInstance.current);
      setGeolocateControl(geolocateControl);
      geolocateControl.trigger();
    });

    return () => {
      setMap(null);
      setGeolocateControl(null);
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, [setMap, setGeolocateControl]);

  return (
    <div>
      <div ref={mapContainer} className="w-full h-screen" />
    </div>
  );
}
