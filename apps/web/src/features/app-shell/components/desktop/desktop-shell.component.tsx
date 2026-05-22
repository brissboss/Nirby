import type { ComponentType } from "react";

import type { ShellView } from "../../types/shell.types";
import { ShellViewContent } from "../shell-view-content.component";

import { DesktopSidebar } from "./desktop-sidebar.component";

type DesktopShellProps = {
  viewComponents: Record<ShellView, ComponentType>;
};

export function DesktopShell({ viewComponents }: DesktopShellProps) {
  return (
    <div className="hidden h-full p-4 md:flex lg:p-6">
      <DesktopSidebar>
        <ShellViewContent viewComponents={viewComponents} />
      </DesktopSidebar>
    </div>
  );
}
