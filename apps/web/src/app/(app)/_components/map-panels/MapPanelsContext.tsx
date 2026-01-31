"use client";

import { createContext, useContext, useState } from "react";

type MapPanelsContextType = {
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  isDrawerExpanded: boolean;
  setIsDrawerExpanded: (expanded: boolean) => void;
};

const MapPanelsContext = createContext<MapPanelsContextType | null>(null);

export function MapPanelsProvider({ children }: { children: React.ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);

  return (
    <MapPanelsContext.Provider
      value={{
        isDrawerOpen,
        setIsDrawerOpen,
        isDrawerExpanded,
        setIsDrawerExpanded,
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
