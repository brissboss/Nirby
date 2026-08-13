"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import type { GetSharedListPoisData } from "@/lib/api";
import { getSharedListPois } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

export type SharedListPoisInfiniteFilters = Omit<
  NonNullable<GetSharedListPoisData["query"]>,
  "page"
>;

/** Default page size — matches API default (20). */
export const SHARED_LIST_POIS_PAGE_SIZE = 20;

async function fetchSharedListPoisPage(
  shareToken: string,
  filters: SharedListPoisInfiniteFilters | undefined,
  page: number
) {
  const response = await getSharedListPois({
    path: { shareToken },
    query: {
      ...filters,
      page,
      limit: filters?.limit ?? SHARED_LIST_POIS_PAGE_SIZE,
    },
  });

  if (response.data) {
    return response.data;
  }

  throw response.error;
}

/**
 * Paginated public POIs for a shared list (GET /shared/:shareToken/pois).
 * No auth gate. API errors are thrown for {@link useErrorMessage}.
 */
export function useSharedListPoisInfinite(
  shareToken: string | undefined,
  filters?: SharedListPoisInfiniteFilters
) {
  return useInfiniteQuery({
    queryKey: queryKeys.shared.pois.infinite(shareToken ?? "", filters),
    enabled: Boolean(shareToken),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      if (!shareToken) {
        throw new Error("shareToken is required");
      }

      return fetchSharedListPoisPage(shareToken, filters, pageParam);
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
  });
}
