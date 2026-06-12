"use client";

import { MOBILE_SHEET_HEIGHT } from "../../constants/shell.constants";
import { useShell } from "../../context/shell-context";
import { GlassPanel } from "../shared/glass-panel.component";
import { MobileSheetHeader } from "../shared/mobile-sheet-header.component";
import { ViewTabs } from "../shared/view-tabs.component";

import { cn } from "@/lib/utils";

export function MobileBottomSheet({ children }: { children: React.ReactNode }) {
  const { mapMode, view, setViewAndExitMapMode } = useShell();

  const sheetHeightStyle = mapMode
    ? undefined
    : { height: MOBILE_SHEET_HEIGHT, maxHeight: MOBILE_SHEET_HEIGHT };

  return (
    <GlassPanel
      variant="mobileSheet"
      data-slot="app-shell-mobile"
      style={sheetHeightStyle}
      className={cn(
        "pointer-events-auto absolute inset-x-0 bottom-0 flex min-h-0 flex-col",
        "transition-[height] duration-300 ease-out",
        mapMode && "shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      )}
    >
      {!mapMode && (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain scroll-smooth px-4">
          <MobileSheetHeader />
          {children}
        </div>
      )}
      <div
        className={cn(
          "shrink-0 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2",
          !mapMode && "border-t border-border/50"
        )}
      >
        <ViewTabs value={view} onChange={setViewAndExitMapMode} mobile />
      </div>
    </GlassPanel>
  );
}
