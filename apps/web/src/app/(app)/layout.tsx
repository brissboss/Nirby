"use client";

import { GeolocationButton } from "@/components/map/controls/geolocation-button";
import { UserMenu } from "@/components/map/controls/user-menu";
import { ZoomControls } from "@/components/map/controls/zoom-controls";
import { MapboxMap } from "@/components/map/mapbox-map";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useAuth } from "@/lib/auth";
import { MapProvider } from "@/lib/map/context";
import { PanelsProvider } from "@/lib/panels/context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <PanelsProvider>
      <MapProvider>
        <div className="fixed inset-0 z-0">
          <MapboxMap />
        </div>

        <div
          className={`fixed z-10 flex flex-col ${isMobile ? "gap-5" : "gap-3"}`}
          style={{
            ...(isMobile
              ? {
                  bottom: "calc(5.5rem + env(safe-area-inset-bottom))",
                  right: "calc(1.5rem + env(safe-area-inset-right))",
                }
              : {
                  top: "calc(1rem + env(safe-area-inset-bottom))",
                  right: "calc(1rem + env(safe-area-inset-right))",
                }),
          }}
        >
          {user && !isMobile && <UserMenu />}
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

        {children}
      </MapProvider>
    </PanelsProvider>
  );
}
