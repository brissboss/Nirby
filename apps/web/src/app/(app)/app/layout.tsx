"use client";

import { usePathname } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import { ItemDetailContent } from "@/components/panels/items-detail-content";
import { ListPanelContent } from "@/components/panels/list-panel-content";
import { MobileSheetHandle } from "@/components/shell/mobile-sheet-handle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

type Mode = "home" | "list" | "detail";

export default function AppSectionLayout({
  children,
  panel,
}: {
  children: React.ReactNode;
  panel: React.ReactNode;
}) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const pathname = usePathname();

  const mode: Mode = useMemo(() => {
    if (pathname.includes("/items/")) return "detail";
    if (pathname.includes("/lists/")) return "list";
    return "home";
  }, [pathname]);

  // const [sheetOpen, setSheetOpen] = useState(false);
  // const [isPeeked, setIsPeeked] = useState(false);
  const [sheetState, setSheetState] = useState<"closed" | "peeked" | "open">("closed");

  useEffect(() => {
    if (!isMobile) return;
    if (mode !== "list" && mode !== "detail") return;
    if (sheetState === "open" || sheetState === "peeked") return;

    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) setSheetState("open");
    });

    return () => {
      cancelled = true;
    };
  }, [isMobile, mode, sheetState, pathname]);

  const handleSheetOpenChange = (open: boolean) => {
    if (!open) {
      if (mode === "home") {
        setSheetState("closed");
      } else {
        setSheetState("peeked");
      }
    } else {
      setSheetState("open");
    }
  };

  const handleExpand = () => {
    setSheetState("open");
  };

  if (isMobile) {
    return (
      <>
        <MobileSheetHandle onOpen={() => setSheetState("open")} />
        <Sheet
          open={sheetState === "open" || sheetState === "peeked"}
          onOpenChange={handleSheetOpenChange}
          modal={false}
        >
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className={cn(
              "rounded-t-2xl transition-[max-height] duration-300 ease-in-out", // Transition sur max-height
              sheetState === "peeked" ? "max-h-[200px] overflow-hidden" : "max-h-[80vh]" // Hauteur max très grande pour l'état open
            )}
            onInteractOutside={(e) => {
              if (sheetState === "peeked" && mode !== "home") {
                e.preventDefault();
              }
            }}
            onClick={sheetState === "peeked" ? handleExpand : undefined}
          >
            {/* Header minimal */}
            <div className="px-4 pt-3 pb-2">
              <div className="mx-auto h-1.5 w-10 rounded-full bg-muted" />
              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm font-medium">
                  {mode === "home" && "Explore"}
                  {mode === "list" && "List"}
                  {mode === "detail" && "Details"}
                </div>
              </div>
            </div>

            <div
              className={cn(
                "px-4 pb-6 transition-all duration-300 ease-in-out overflow-hidden",
                sheetState === "peeked" ? "max-h-0 opacity-0" : "max-h-[2000px] opacity-100"
              )}
            >
              {mode === "home" && <div className="flex flex-col gap-3">{children}</div>}
              {mode === "list" && <ListPanelContent />}
              {mode === "detail" && <ItemDetailContent />}
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop/tablet: panels flottants
  return (
    <>
      {/* Left panel */}
      <Card
        className="fixed z-10 w-[50px] md:w-[380px] bg-white dark:bg-background border border-border rounded-xl shadow-lg overflow-hidden flex flex-col p-0"
        style={{
          top: "calc(1rem + env(safe-area-inset-top))",
          left: "calc(1rem + env(safe-area-inset-left))",
          bottom: "calc(1rem + env(safe-area-inset-bottom))",
          maxHeight: "calc(100vh - 2rem - env(safe-area-inset-top) - env(safe-area-inset-bottom))",
        }}
      >
        <CardContent className="flex flex-col h-full min-h-0 p-0">
          <div className="flex-1 overflow-y-auto min-h-0 p-4">
            <div className="flex flex-col gap-2">
              {children}
              {/* TODO: Search + Lists */}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right panel (desktop) */}
      {panel}
    </>
  );
}
