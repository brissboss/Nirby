"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { LIST_POIS_PAGE_SIZE } from "./use-list-pois";

import { useAuth } from "@/features/auth";
import type { GetListPoisData } from "@/lib/api";
import { getListPois } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

export type ListPoisInfiniteFilters = Omit<NonNullable<GetListPoisData["query"]>, "page">;

async function fetchListPoisPage(
  listId: string,
  filters: ListPoisInfiniteFilters | undefined,
  page: number
) {
  const response = await getListPois({
    path: { listId },
    query: {
      ...filters,
      page,
      limit: filters?.limit ?? LIST_POIS_PAGE_SIZE,
    },
  });

  if (response.data) {
    return response.data;
  }

  throw response.error;
}

/**
 * Paginated saved POIs for infinite scroll (GET /list/:listId/pois).
 * API errors are thrown for {@link useErrorMessage}.
 */
export function useListPoisInfinite(listId: string | undefined, filters?: ListPoisInfiniteFilters) {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: queryKeys.lists.pois.infinite(listId ?? "", filters),
    enabled: Boolean(listId && user),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      if (!listId) {
        throw new Error("listId is required");
      }

      return fetchListPoisPage(listId, filters, pageParam);
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
  });
}
