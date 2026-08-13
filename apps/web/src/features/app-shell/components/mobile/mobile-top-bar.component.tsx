"use client";

import { GlassPanel } from "../shared/glass-panel.component";
import { SearchBox } from "../shared/search-box.component";

export function MobileTopBar() {
  return (
    <GlassPanel
      variant="mobileTopBar"
      className="pointer-events-auto absolute inset-x-4 top-[calc(0.75rem+env(safe-area-inset-top))] z-10 p-0"
    >
      <div className="flex items-center gap-3">
        <SearchBox compact />
      </div>
    </GlassPanel>
  );
}
