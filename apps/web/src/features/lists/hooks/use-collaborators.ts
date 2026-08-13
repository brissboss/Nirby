"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { getCollaborators } from "@/lib/api";
import type { GetCollaboratorsData } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

/** Query params for `GET /list/:listId/collaborators` (page, limit). */
export type CollaboratorsFilters = GetCollaboratorsData["query"];

/** Default page size — matches API default (20). */
export const COLLABORATORS_PAGE_SIZE = 20;

/**
 * Fetches collaborators for a list with optional pagination.
 *
 * The query is disabled until `listId` is defined and the user is authenticated.
 * API errors are thrown so they can be handled with {@link useErrorMessage}.
 * Uses `keepPreviousData` to avoid empty UI flashes when paginating.
 */
export function useCollaborators(listId: string | undefined, filters?: CollaboratorsFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.lists.collaborators.list(listId ?? "", filters),
    enabled: Boolean(listId && user),
    queryFn: async () => {
      if (!listId) {
        throw new Error("listId is required");
      }

      const response = await getCollaborators({
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
