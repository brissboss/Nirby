"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui";

type ListsIndexViewProps = {
  onCreate: () => void;
};

export function ListsIndexView({ onCreate }: ListsIndexViewProps) {
  const tLists = useTranslations("lists");

  return (
    <div className="grid gap-4 pb-4">
      <header className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          {tLists("index.title")}
        </h2>
        <Button type="button" size="sm" onClick={onCreate}>
          {tLists("index.create")}
        </Button>
      </header>

      {/* Temporaire jusqu’à NIR-55 : empty state ou liste useLists() */}
      <p className="text-sm text-muted-foreground">{tLists("index.empty.title")}</p>
    </div>
  );
}
