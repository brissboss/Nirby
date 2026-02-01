"use client";

import { usePathname } from "next/navigation";

import { MapPanelsProvider, MapPanels } from "@/app/(app)/_components";
import { useAuth } from "@/features/auth";
import { BrowseContent } from "@/features/browse";
import { GeolocationButton, MapboxMap, UserMenu, ZoomControls } from "@/features/map";
import { MapProvider } from "@/features/map";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const isListPage = pathname.startsWith("/list");

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

      <MapPanelsProvider>
        <MapPanels isDetailRoute={isListPage} browseContent={<BrowseContent />}>
          {children}
        </MapPanels>
      </MapPanelsProvider>
    </MapProvider>
  );
}
