"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import type { GetListsData } from "@/lib/api";
import { getLists } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

export type ListsInfiniteFilters = Omit<NonNullable<GetListsData["query"]>, "page">;

export const LISTS_PAGE_SIZE = 20;

async function fetchListsPage(filters: ListsInfiniteFilters | undefined, page: number) {
  const response = await getLists({
    query: {
      ...filters,
      page,
      limit: filters?.limit ?? LISTS_PAGE_SIZE,
    },
  });

  if (response.data) {
    return response.data;
  }

  throw response.error;
}

/**
 * Paginated lists for infinite scroll (GET /list).
 * API errors are thrown for {@link useErrorMessage}.
 */
export function useListsInfinite(filters?: ListsInfiniteFilters) {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: queryKeys.lists.infinite(filters),
    enabled: Boolean(user),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchListsPage(filters, pageParam),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
  });
}
