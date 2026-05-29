"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteList } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

/**
 * Deletes a list owned by the authenticated user.
 *
 * On success, refreshes the list index and removes the deleted list from cache.
 * API errors are thrown so they can be handled with {@link useErrorMessage}.
 */
export function useDeleteList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: string) => {
      const response = await deleteList({ path: { listId } });

      if (response.data) {
        return response.data;
      }

      throw response.error;
    },
    onSuccess: (_data, listId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.all });
      queryClient.removeQueries({ queryKey: queryKeys.lists.detail(listId) });
    },
  });
}
