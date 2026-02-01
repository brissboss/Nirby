"use client";

import { useMapPanels } from "@/app/(app)/_components";
import { Card, CardContent, CardHeader, Drawer, DrawerContent, DrawerTitle } from "@/components/ui";
import { useMediaQuery } from "@/hooks/use-media-query";

interface MapPanelsProps {
  isDetailRoute: boolean;
  browseContent: React.ReactNode;
  children: React.ReactNode;
}

export function MapPanels({ isDetailRoute, browseContent, children }: MapPanelsProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { snap, setSnap, snapPoints } = useMapPanels();

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
          repositionInputs={false}
        >
          <DrawerContent
            className="h-full overflow-y-auto"
            style={{
              maxHeight: "90vh",
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
