"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { getListPois } from "@/lib/api";
import type { GetListPoisData } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

/** Query params for `GET /list/:listId/pois` (page, limit). */
export type ListPoisFilters = GetListPoisData["query"];

/** Default page size — matches API default (20). */
export const LIST_POIS_PAGE_SIZE = 20;

/**
 * Fetches saved POIs for a list with optional pagination.
 *
 * The query is disabled until `listId` is defined and the user is authenticated.
 * API errors are thrown so they can be handled with {@link useErrorMessage}.
 * Uses `keepPreviousData` to avoid empty UI flashes when paginating.
 */
export function useListPois(listId: string | undefined, filters?: ListPoisFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.lists.pois.list(listId ?? "", filters),
    enabled: Boolean(listId && user),
    queryFn: async () => {
      if (!listId) {
        throw new Error("listId is required");
      }

      const response = await getListPois({
        path: { listId },
        query: filters,
      });

      if (response.data) {
        return response.data;
      }

      throw response.error;
    },
    placeholderData: keepPreviousData,
  });
}
