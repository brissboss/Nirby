import { LockIcon, UsersIcon, GlobeIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import type { ListVisibility } from "../constants/lists.constants";

import { Badge } from "@/components/ui";

export function ListVisibilityBadge({ visibility }: { visibility: ListVisibility }) {
  const tLists = useTranslations("lists");

  return (
    <Badge variant="outline" className="text-muted-foreground">
      {visibility === "PRIVATE" && <LockIcon />}
      {visibility === "SHARED" && <UsersIcon />}
      {visibility === "PUBLIC" && <GlobeIcon />}
      {tLists(`visibility.${visibility}.label`)}
    </Badge>
  );
}
