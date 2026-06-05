"use client";

import { ListPlusIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui";

type ListsIndexEmptyProps = {
  onCreate: () => void;
};

export function ListsIndexEmpty({ onCreate }: ListsIndexEmptyProps) {
  const tLists = useTranslations("lists");
  const description = tLists("index.empty.description");

  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
        <ListPlusIcon className="size-6" aria-hidden />
      </span>
      <div className="grid max-w-sm gap-1">
        <h3 className="font-display text-base font-semibold tracking-tight">
          {tLists("index.empty.title")}
        </h3>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <Button type="button" size="sm" onClick={onCreate}>
        <PlusIcon />
        {tLists("index.empty.cta")}
      </Button>
    </div>
  );
}
