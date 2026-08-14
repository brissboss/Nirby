"use client";

import { Suspense } from "react";

import { shellViewComponents } from "./shell-view";

import { AppShell } from "@/features/app-shell";
import { GeolocationButton, MapboxMap, ZoomControls, MapProvider } from "@/features/map";
import { CreatePoiFromMap } from "@/features/pois/components/create-poi-from-map";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <MapProvider>
      <div className="fixed inset-0 z-0">
        <MapboxMap />
      </div>

      <Suspense fallback={null}>
        <CreatePoiFromMap />
      </Suspense>

      <div className="fixed right-[calc(1rem+env(safe-area-inset-right))] top-[calc(5.75rem+env(safe-area-inset-top))] z-30 flex flex-col gap-3 md:top-[calc(1rem+env(safe-area-inset-top))]">
        <GeolocationButton />
      </div>

      <div className="fixed right-[calc(1rem+env(safe-area-inset-right))] bottom-[var(--shell-mobile-chrome-bottom,calc(80dvh+env(safe-area-inset-bottom)))] z-30 max-md:transition-[bottom] max-md:duration-300 md:bottom-[calc(2rem+env(safe-area-inset-bottom))]">
        <ZoomControls />
      </div>

      {children}
      <AppShell viewComponents={shellViewComponents} />
    </MapProvider>
  );
}
