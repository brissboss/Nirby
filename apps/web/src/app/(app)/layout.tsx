"use client";

import { useAuth } from "@/features/auth";
import { GeolocationButton, MapboxMap, UserMenu, ZoomControls, MapProvider } from "@/features/map";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <MapProvider>
      <div className="fixed inset-0 z-0">
        <MapboxMap />
      </div>

      <div
        className="fixed z-10 flex flex-col gap-3"
        style={{
          right: "calc(1rem + env(safe-area-inset-right))",
          top: "calc(1rem + env(safe-area-inset-top))",
        }}
      >
        {user && <UserMenu />}
        <GeolocationButton />
      </div>

      <div
        className="fixed z-10"
        style={{
          right: "calc(1rem + env(safe-area-inset-right))",
          bottom: "calc(2rem + env(safe-area-inset-bottom))",
        }}
      >
        <ZoomControls />
      </div>

      {children}
    </MapProvider>
  );
}
