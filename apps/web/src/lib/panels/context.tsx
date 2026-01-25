"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type PanelsState = {
  leftOpen: boolean;
  rightOpen: boolean;
  setLeftOpen: (v: boolean) => void;
  setRightOpen: (v: boolean) => void;
  toggleLeft: () => void;
  toggleRight: () => void;
};

const PanelsContext = createContext<PanelsState | null>(null);

export function PanelsProvider({ children }: { children: React.ReactNode }) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const value = useMemo(
    () => ({
      leftOpen,
      rightOpen,
      setLeftOpen,
      setRightOpen,
      toggleLeft: () => setLeftOpen((v) => !v),
      toggleRight: () => setRightOpen((v) => !v),
    }),
    [leftOpen, rightOpen]
  );

  return <PanelsContext.Provider value={value}>{children}</PanelsContext.Provider>;
}

export function usePanels() {
  const ctx = useContext(PanelsContext);
  if (!ctx) throw new Error("usePanels must be used within a PanelsProvider");
  return ctx;
}
