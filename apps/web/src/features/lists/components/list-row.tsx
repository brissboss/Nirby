import { MapPinIcon, UsersIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { ListVisibilityBadge } from "./list-visibility-badge";

import { ListWithRole } from "@/lib/api";
import { cn } from "@/lib/utils";

type ListRowProps = {
  list: ListWithRole;
  onClick: () => void;
};

export function ListRow({ list, onClick }: ListRowProps) {
  const tRow = useTranslations("lists.row");

  const poiCount = list.poiCount ?? 0;
  const collaboratorCount = list.collaboratorCount ?? 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full min-w-0 rounded-md border border-border text-left",
        "cursor-pointer transition-[box-shadow,transform,border-color,scale] duration-200",
        "hover:border-foreground/15 hover:shadow-md hover:shadow-black/5 hover:scale-[1.03]",
        "active:scale-[0.99] active:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      )}
    >
      <div className="rounded-t-md p-4 bg-linear-to-br from-[#EA580C] via-primary to-amber-500 transition-[filter] duration-200 group-hover:brightness-105">
        <h3 className="line-clamp-1 min-w-0 wrap-break-words text-md font-bold text-white font-display">
          {list.name}
        </h3>

        <p className="line-clamp-2 min-w-0 wrap-break-words text-sm text-white/80 font-semibold font-display">
          {list.description}
        </p>
      </div>
      <div className="px-4 py-2 flex items-center justify-between gap-2 transition-colors group-hover:bg-muted/30">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1">
          <span className="flex items-center gap-1">
            <MapPinIcon className="size-3 shrink-0 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{tRow("poiCount", { count: poiCount })}</p>
          </span>
          {collaboratorCount > 0 && (
            <span className="flex items-center gap-1">
              <UsersIcon className="size-3 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                {tRow("collaboratorCount", { count: collaboratorCount })}
              </p>
            </span>
          )}
        </div>
        <ListVisibilityBadge visibility={list.visibility} />
      </div>
    </button>
  );
}
