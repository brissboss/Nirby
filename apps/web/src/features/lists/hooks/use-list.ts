"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { getListById } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

/**
 * Fetches a single list by ID for the authenticated user.
 *
 * The query is disabled until `listId` is defined.
 * API errors are thrown so they can be handled with {@link useErrorMessage}.
 */
export function useList(listId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.lists.detail(listId ?? ""),
    enabled: Boolean(listId && user),
    queryFn: async () => {
      if (!listId) {
        throw new Error("listID is required");
      }

      const response = await getListById({ path: { listId } });

      if (response.data) {
        return response.data;
      }

      throw response.error;
    },
  });
}
