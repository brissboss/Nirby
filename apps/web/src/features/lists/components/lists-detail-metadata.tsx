"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

import { ListVisibilityBadge } from "./list-visibility-badge";

import { Badge } from "@/components/ui";
import type { ListWithRole } from "@/lib/api";

type ListsDetailMetadataProps = {
  list: Pick<ListWithRole, "role" | "visibility" | "createdAt" | "updatedAt">;
};

export function ListsDetailMetadata({ list }: ListsDetailMetadataProps) {
  const tLists = useTranslations("lists");
  const locale = useLocale();

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
      }),
    [locale]
  );

  const createdAtLabel = tLists("detail.createdAt", {
    date: dateFormatter.format(new Date(list.createdAt)),
  });

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {list.role && <Badge variant="secondary">{tLists(`role.${list.role}`)}</Badge>}

        <ListVisibilityBadge visibility={list.visibility} />
      </div>

      <div className="text-xs text-muted-foreground">
        <p>{createdAtLabel}</p>
      </div>
    </div>
  );
}
