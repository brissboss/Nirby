"use client";

import { createContext, useCallback, useContext, useState } from "react";

export type MapSelectionSource = "search" | "list";

type MapSelectionContextValue = {
  selectedPoiId: string | null;
  selectedSource: MapSelectionSource | null;
  setSelected: (placeId: string, source: MapSelectionSource) => void;
  clearSelection: () => void;
};

const MapSelectionContext = createContext<MapSelectionContextValue | null>(null);

export function MapSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<MapSelectionSource | null>(null);

  const setSelected = useCallback((poidId: string, source: MapSelectionSource) => {
    setSelectedPoiId(poidId);
    setSelectedSource(source);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedPoiId(null);
    setSelectedSource(null);
  }, []);

  return (
    <MapSelectionContext.Provider
      value={{ selectedPoiId, selectedSource, setSelected, clearSelection }}
    >
      {children}
    </MapSelectionContext.Provider>
  );
}

export function useMapSelection() {
  const context = useContext(MapSelectionContext);
  if (!context) {
    throw new Error("useMapSelection must be used within a MapSelectionProvider");
  }
  return context;
}
