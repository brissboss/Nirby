import type { ComponentType } from "react";

import { useShell } from "../../context/shell-context";
import { useMobileChromeBottom } from "../../hooks/use-mobile-chrome-bottom";
import type { ShellView } from "../../types/shell.types";
import { ShellViewContent } from "../shell-view-content.component";

import { MobileBottomSheet } from "./mobile-bottom-sheet.component";
import { MobileTopBar } from "./mobile-top-bar.component";

type MobileShellProps = {
  viewComponents: Record<ShellView, ComponentType>;
};

export function MobileShell({ viewComponents }: MobileShellProps) {
  const { mapMode } = useShell();
  useMobileChromeBottom(mapMode);

  return (
    <div className="md:hidden">
      <MobileTopBar />
      <MobileBottomSheet>
        <ShellViewContent viewComponents={viewComponents} />
      </MobileBottomSheet>
    </div>
  );
}
