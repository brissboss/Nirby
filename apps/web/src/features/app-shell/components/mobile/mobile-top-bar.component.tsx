"use client";

import { useShell } from "../../context/shell-context";
import { GlassPanel } from "../shared/glass-panel.component";
import { SearchBox } from "../shared/search-box.component";

import { Logo } from "@/components/logo";

export function MobileTopBar() {
  const { view } = useShell();

  return (
    <GlassPanel
      variant="mobileTopBar"
      className="pointer-events-auto absolute inset-x-4 top-[calc(0.75rem+env(safe-area-inset-top))] z-10 p-3"
    >
      <div className="flex items-center gap-3">
        <Logo className="size-9 shrink-0" />
        {view === "explore" && <SearchBox compact />}
      </div>
    </GlassPanel>
  );
}
