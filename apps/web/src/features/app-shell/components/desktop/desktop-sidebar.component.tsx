import { useShell } from "../../context/shell-context";
import { GlassPanel } from "../shared/glass-panel.component";
import { SearchBox } from "../shared/search-box.component";
import { ShellHeader } from "../shared/shell-header.component";
import { ViewTabs } from "../shared/view-tabs.component";

export function DesktopSidebar({ children }: { children: React.ReactNode }) {
  const { view, setView } = useShell();

  return (
    <GlassPanel
      variant="sidebar"
      className="pointer-events-auto flex h-full w-[390px] flex-col overflow-hidden lg:w-[430px]"
    >
      <ShellHeader />
      {view === "explore" && <SearchBox />}
      <ViewTabs value={view} onChange={setView} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
    </GlassPanel>
  );
}
