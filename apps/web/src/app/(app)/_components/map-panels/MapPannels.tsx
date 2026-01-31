"use client";

import { useState, useEffect } from "react";

import { useMapPanels } from "@/app/(app)/_components";
import { Card, CardContent, CardHeader, Drawer, DrawerContent, DrawerTitle } from "@/components/ui";
import { useMediaQuery } from "@/hooks/use-media-query";

interface MapPannelsProps {
  isDetailRoute: boolean;
  browseContent: React.ReactNode;
  children: React.ReactNode;
}

const snapPoints = ["190px", 1];

export function MapPannels({ isDetailRoute, browseContent, children }: MapPannelsProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { setIsDrawerExpanded } = useMapPanels();

  const [snap, setSnap] = useState<number | string | null>(snapPoints[0]);

  useEffect(() => {
    if (snap === 1) {
      setIsDrawerExpanded(true);
    } else {
      setIsDrawerExpanded(false);
    }
  }, [snap, setIsDrawerExpanded]);

  if (isMobile) {
    return (
      <>
        <Drawer
          snapPoints={snapPoints}
          activeSnapPoint={snap}
          setActiveSnapPoint={setSnap}
          snapToSequentialPoint
          modal={false}
          open={true}
          dismissible={false}
        >
          <DrawerContent
            className="h-full"
            style={{
              maxHeight: "90dvh",
              paddingBottom: "max(env(safe-area-inset-bottom), 0px)",
            }}
          >
            <DrawerTitle className="sr-only">_</DrawerTitle>
            {isDetailRoute ? children : browseContent}
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <div
      className="fixed z-10 flex gap-3 w-fit h-full p-4"
      style={{
        top: "calc(0rem + env(safe-area-inset-top))",
        left: "calc(0rem + env(safe-area-inset-left))",
        bottom: "calc(0rem + env(safe-area-inset-bottom))",
        right: "calc(0rem + env(safe-area-inset-right))",
      }}
    >
      <Card className="w-[50px] md:w-[380px] h-full bg-background border border-border rounded-xl shadow-lg overflow-hidden z-10 block p-0">
        <CardHeader className="hidden" />
        <CardContent className="p-0">{browseContent}</CardContent>
      </Card>

      {isDetailRoute ? (
        <Card className="w-[50px] md:w-[380px] h-full bg-background border border-border rounded-xl shadow-lg overflow-hidden z-10 block p-0">
          <CardHeader className="hidden" />
          <CardContent className="p-0">{children}</CardContent>
        </Card>
      ) : null}
    </div>
  );
}
