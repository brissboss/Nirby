"use client";

import { GeolocationButton } from "@/components/map/controls/geolocation-button";
import { ZoomControls } from "@/components/map/controls/zoom-controls";
import { MapboxMap } from "@/components/map/mapbox-map";
import { MapProvider } from "@/lib/map/context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <MapProvider>
      <div className="fixed inset-0 z-0">
        <MapboxMap />
      </div>

      <div
        className="fixed z-10 flex flex-col gap-3"
        style={{
          right: "calc(1rem + env(safe-area-inset-right))",
          top: "calc(1rem + env(safe-area-inset-bottom))",
        }}
      >
        <GeolocationButton />
      </div>

      <div
        className="fixed z-10 flex flex-col gap-3"
        style={{
          right: "calc(1rem + env(safe-area-inset-right))",
          bottom: "calc(2rem + env(safe-area-inset-bottom))",
        }}
      >
        <ZoomControls />
      </div>

      <div
        className="fixed w-[380px] h-[60%] bg-white border border-border rounded-xl shadow-lg overflow-hidden z-10 hidden md:block"
        style={{
          top: "calc(1rem + env(safe-area-inset-top))",
          left: "calc(1rem + env(safe-area-inset-left))",
          bottom: "calc(1rem + env(safe-area-inset-bottom))",
          right: "calc(1rem + env(safe-area-inset-right))",
        }}
      >
        <div className="h-full overflow-y-auto p-4">{children}</div>
      </div>
    </MapProvider>
  );
}
