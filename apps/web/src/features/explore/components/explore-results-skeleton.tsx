"use client";

import { useTranslations } from "next-intl";

import { Skeleton } from "@/components/ui";

const SKELETON_COUNT = 3;

export function ExploreResultsSkeleton() {
  const tExplore = useTranslations("explore");

  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label={tExplore("search.loading")}>
      {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-md border border-border">
          <Skeleton className="h-[150px] w-full rounded-none" />
          <div className="flex flex-col gap-2 px-4 py-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
