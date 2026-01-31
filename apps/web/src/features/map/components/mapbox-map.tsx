"use client";

import { Loader2 } from "lucide-react";
import mapboxgl from "mapbox-gl";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

import { useMap } from "@/features/map";

export function MapboxMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const mapLoaded = useRef(false);
  const themeRef = useRef<string | undefined>(undefined);
  const { setMap, setGeolocateControl } = useMap();
  const { resolvedTheme } = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    themeRef.current = resolvedTheme;
  }, [resolvedTheme]);

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
      mapLoaded.current = true;
      setMap(mapInstance.current);
      setGeolocateControl(geolocateControl);
      geolocateControl.trigger();

      const lightPreset = themeRef.current === "dark" ? "night" : "day";
      mapInstance.current?.setConfigProperty("basemap", "lightPreset", lightPreset);

      setTimeout(() => {
        setIsLoaded(true);
      }, 50);
    });

    return () => {
      mapLoaded.current = false;
      setIsLoaded(false);
      setMap(null);
      setGeolocateControl(null);
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, [setMap, setGeolocateControl]);

  useEffect(() => {
    if (!mapInstance.current || !mapLoaded.current) return;

    const lightPreset = resolvedTheme === "dark" ? "night" : "day";
    mapInstance.current.setConfigProperty("basemap", "lightPreset", lightPreset);
  }, [resolvedTheme]);

  return (
    <div className="relative w-full h-screen">
      <div
        ref={mapContainer}
        className={`w-full h-full`}
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 0.5s ease-in-out",
        }}
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
