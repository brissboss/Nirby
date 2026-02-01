"use client";

import { createContext, useContext, useState } from "react";

type MapPanelsContextType = {
  isDrawerExpanded: boolean;
  snapPoints: (number | string)[];
  snap: number | string | null;
  setSnap: (snap: number | string | null) => void;
};

const MapPanelsContext = createContext<MapPanelsContextType | null>(null);

const snapPoints = ["190px", 1];

export function MapPanelsProvider({ children }: { children: React.ReactNode }) {
  const [snap, setSnap] = useState<number | string | null>(snapPoints[0] as number | string);
  const isDrawerExpanded = snap === 1;

  return (
    <MapPanelsContext.Provider
      value={{
        isDrawerExpanded,
        snapPoints,
        snap,
        setSnap,
      }}
    >
      {children}
    </MapPanelsContext.Provider>
  );
}

export function useMapPanels() {
  const context = useContext(MapPanelsContext);
  if (!context) {
    throw new Error("useMapPanels must be used within a MapPanelsProvider");
  }
  return context;
}
