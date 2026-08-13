"use client";

import { Loader2Icon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback } from "react";

import { ListRow } from "../components/list-row";
import { ListsIndexEmpty } from "../components/lists-index-empty";
import { ListsIndexError } from "../components/lists-index-error";
import { ListsIndexSkeleton } from "../components/lists-index-skeleton";

import { Button } from "@/components/ui";
import { useInfiniteScroll } from "@/features/lists/hooks/use-infinite-scroll";
import { useListsInfinite } from "@/features/lists/hooks/use-lists-infinite";
import { useErrorMessage } from "@/hooks/use-error-message";
import type { ListWithRole } from "@/lib/api";

type ListsIndexViewProps = {
  onCreate: () => void;
  onSelectList: (listId: string) => void;
};

export function ListsIndexView({ onCreate, onSelectList }: ListsIndexViewProps) {
  const tLists = useTranslations("lists");
  const getErrorMessage = useErrorMessage();

  const {
    data,
    isPending,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useListsInfinite();

  const items = data?.pages.flatMap((page) => page.lists) ?? [];
  const total = data?.pages[0]?.pagination.total ?? 0;
  const isInitialLoading = (isPending || isLoading) && items.length === 0;
  const isRefreshing = isFetching && !isFetchingNextPage && items.length > 0;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const sentinelRef = useInfiniteScroll(loadMore, {
    enabled: hasNextPage === true && !isError && items.length > 0,
  });

  return (
    <div className="grid w-full min-w-0 gap-4 pb-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">
            {tLists("index.title")}
          </h2>
          <p className="text-sm text-muted-foreground">{tLists("index.total", { total })}</p>
        </div>
        {items.length > 0 && (
          <Button type="button" variant="outline" size="sm" onClick={onCreate}>
            <PlusIcon />
            {tLists("index.create")}
          </Button>
        )}
      </header>

      {isInitialLoading && <ListsIndexSkeleton />}

      {!isInitialLoading && isError && (
        <ListsIndexError message={getErrorMessage(error)} onRetry={() => refetch()} />
      )}

      {!isInitialLoading && !isError && items.length === 0 && (
        <ListsIndexEmpty onCreate={onCreate} />
      )}

      {!isInitialLoading && !isError && items.length > 0 && (
        <>
          {isRefreshing && (
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {tLists("index.refreshing")}
            </p>
          )}

          <ul className="flex w-full min-w-0 flex-col gap-3">
            {items.map((list: ListWithRole) => (
              <li key={list.id}>
                <ListRow list={list} onClick={() => onSelectList(list.id)} />
              </li>
            ))}
          </ul>

          {/* Sentinel : déclenche fetchNextPage au scroll */}
          <div ref={sentinelRef} className="h-1 w-full" aria-hidden />

          {isFetchingNextPage && (
            <div
              className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground"
              aria-busy="true"
              aria-live="polite"
            >
              <Loader2Icon className="size-4 animate-spin" />
              {tLists("index.loadingMore")}
            </div>
          )}
        </>
      )}
    </div>
  );
}
