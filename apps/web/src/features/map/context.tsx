"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface MapContextType {
  map: mapboxgl.Map | null;
  setMap: (map: mapboxgl.Map | null) => void;
  geolocateControl: mapboxgl.GeolocateControl | null;
  setGeolocateControl: (geolocateControl: mapboxgl.GeolocateControl | null) => void;
}

const MapContext = createContext<MapContextType | null>(null);

export function MapProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [geolocateControl, setGeolocateControl] = useState<mapboxgl.GeolocateControl | null>(null);

  return (
    <MapContext.Provider value={{ map, setMap, geolocateControl, setGeolocateControl }}>
      {children}
    </MapContext.Provider>
  );
}

export function useMap() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMap must be used within a MapProvider");
  }
  return context;
}
