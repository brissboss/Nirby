"use client";

import { GeolocationButton } from "@/components/map/controls/geolocation-button";
import { UserMenu } from "@/components/map/controls/user-menu";
import { ZoomControls } from "@/components/map/controls/zoom-controls";
import { MapboxMap } from "@/components/map/mapbox-map";
import { Card, CardContent } from "@/components/ui/card";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useAuth } from "@/lib/auth";
import { MapProvider } from "@/lib/map/context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <MapProvider>
      <div className="fixed inset-0 z-0">
        <MapboxMap />
      </div>

      <div
        className="fixed z-10 flex flex-col gap-3"
        style={{
          right: "calc(1rem + env(safe-area-inset-right))",
          top: isMobile
            ? "calc(2rem + env(safe-area-inset-bottom))"
            : "calc(1rem + env(safe-area-inset-bottom))",
        }}
      >
        {user && <UserMenu />}
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

      <Card
        className="fixed w-[50px] md:w-[380px] h-fit bg-white dark:bg-background border border-border rounded-xl shadow-lg overflow-hidden z-10 block mt-10"
        style={{
          top: "calc(1rem + env(safe-area-inset-top))",
          left: "calc(1rem + env(safe-area-inset-left))",
          bottom: "calc(1rem + env(safe-area-inset-bottom))",
          right: "calc(1rem + env(safe-area-inset-right))",
        }}
      >
        <CardContent>
          <div className="flex flex-col gap-2">{children}</div>
        </CardContent>
      </Card>
    </MapProvider>
  );
}
