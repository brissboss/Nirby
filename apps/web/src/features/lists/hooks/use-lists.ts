"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getLists } from "@/lib/api";
import type { GetListsData } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

/** Query params for `GET /list` (page, limit, search, roles, visibility). */
export type ListFilters = GetListsData["query"];

/**
 * Fetches the authenticated user's lists with optional pagination and filters.
 *
 * API errors are thrown so they can be handled with {@link useErrorMessage}.
 * Uses `keepPreviousData` to avoid empty UI flashes when paginating.
 */
export function useLists(filters?: ListFilters) {
  return useQuery({
    queryKey: queryKeys.lists.list(filters),
    queryFn: async () => {
      const response = await getLists({ query: filters });

      if (response.data) {
        return response.data;
      }

      throw response.error;
    },
    placeholderData: keepPreviousData,
  });
}
