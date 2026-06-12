"use client";

import { OctagonXIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui";

type ListsIndexErrorProps = {
  message: string;
  onRetry: () => void;
};

export function ListsIndexError({ message, onRetry }: ListsIndexErrorProps) {
  const tLists = useTranslations("lists");

  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center" role="alert">
      <span className="grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
        <OctagonXIcon className="size-6" aria-hidden />
      </span>
      <div className="grid max-w-sm gap-1">
        <h3 className="font-display text-base font-semibold tracking-tight">
          {tLists("index.error.title")}
        </h3>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        {tLists("index.error.retry")}
      </Button>
    </div>
  );
}
