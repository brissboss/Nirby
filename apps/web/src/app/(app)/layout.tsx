"use client";

import { usePathname, useRouter } from "next/navigation";

import { MapPanelsProvider, MapPannels } from "@/app/(app)/_components";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { useAuth } from "@/features/auth";
import { GeolocationButton, MapboxMap, UserMenu, ZoomControls } from "@/features/map";
import { MapProvider } from "@/features/map";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
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
        <MapPannels
          isDetailRoute={isListPage}
          browseContent={
            <CardContent>
              {user && !isLoading ? (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <p>Logged in as {user.email}</p>
                    <Button onClick={() => logout()}>Logout</Button>

                    <Button onClick={() => router.push("/list/123")}>List</Button>
                  </div>
                </div>
              ) : !user ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <p>Not logged in</p>
                  <Button onClick={() => router.push("/login")}>Login</Button>
                </div>
              ) : (
                <div className="">Loading...</div>
              )}
            </CardContent>
          }
        >
          {children}
        </MapPannels>
      </MapPanelsProvider>
    </MapProvider>
  );
}
