"use client";

import { Loader2Icon, MapPinOffIcon, OctagonXIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback } from "react";

import { canEditList, type ListRole } from "../constants/lists.constants";
import { useInfiniteScroll } from "../hooks/use-infinite-scroll";
import { useListPoisInfinite } from "../hooks/use-list-pois-infinite";

import { ListPoiRow } from "./list-poi-row";
import { ListPoisSkeleton } from "./list-pois-skeleton";

import { Button } from "@/components/ui";
import type { SavedPoiListItem } from "@/features/pois";
import { useErrorMessage } from "@/hooks/use-error-message";

type ListPoisSectionProps = {
  listId: string;
  role?: ListRole;
};

export function ListPoisSection({ listId, role }: ListPoisSectionProps) {
  const canRemove = canEditList(role);
  const tLists = useTranslations("lists");
  const getErrorMessage = useErrorMessage();

  const {
    data,
    isPending,
    isLoading,
    isError,
    error,
    refetch,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useListPoisInfinite(listId);

  const items = data?.pages.flatMap((page) => page.savedPois) ?? [];
  const total = data?.pages[0]?.pagination.total;
  const isInitialLoading = (isPending || isLoading) && items.length === 0;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const sentinelRef = useInfiniteScroll(loadMore, {
    enabled: hasNextPage === true && !isError && items.length > 0,
  });

  return (
    <section className="border-t border-border pt-6">
      <header className="mb-4 grid gap-1">
        <h2 className="font-display text-base font-semibold tracking-tight">
          {tLists("pois.section.title")}
        </h2>
        {!isInitialLoading && !isError && total !== undefined ? (
          <p className="text-sm text-muted-foreground">{tLists("pois.section.total", { total })}</p>
        ) : null}
      </header>

      {isInitialLoading && <ListPoisSkeleton />}

      {!isInitialLoading && isError && (
        <div className="flex flex-col items-center gap-4 py-8 text-center" role="alert">
          <span className="grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
            <OctagonXIcon className="size-6" aria-hidden />
          </span>
          <div className="grid max-w-sm gap-1">
            <h3 className="font-display text-base font-semibold tracking-tight">
              {tLists("pois.error.title")}
            </h3>
            <p className="text-sm text-muted-foreground">{getErrorMessage(error)}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            {tLists("pois.error.retry")}
          </Button>
        </div>
      )}

      {!isInitialLoading && !isError && items.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
            <MapPinOffIcon className="size-6" aria-hidden />
          </span>
          <div className="grid max-w-sm gap-1">
            <h3 className="font-display text-base font-semibold tracking-tight">
              {tLists("pois.empty.title")}
            </h3>
            <p className="text-sm text-muted-foreground">{tLists("pois.empty.description")}</p>
          </div>
        </div>
      )}

      {!isInitialLoading && !isError && items.length > 0 && (
        <>
          <ul className="flex w-full min-w-0 flex-col gap-3">
            {items.map((savedPoi: SavedPoiListItem, index) => (
              <li key={savedPoi.id ?? `saved-poi-${index}`}>
                <ListPoiRow savedPoi={savedPoi} listId={listId} canRemove={canRemove} />
              </li>
            ))}
          </ul>

          <div ref={sentinelRef} className="h-1 w-full" aria-hidden />

          {isFetchingNextPage && (
            <div
              className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground"
              aria-busy="true"
              aria-live="polite"
            >
              <Loader2Icon className="size-4 animate-spin" />
              {tLists("pois.loadingMore")}
            </div>
          )}
        </>
      )}
    </section>
  );
}
