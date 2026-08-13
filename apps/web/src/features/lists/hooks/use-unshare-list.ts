"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { unshareList } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

/** Payload for `DELETE /list/:listId/share`. */
export type UnshareListInput = {
  listId: string;
};

/**
 * Revokes the public share link for a list.
 *
 * On success, invalidates the list index and the list detail (`shareToken`).
 * API errors are thrown so they can be handled with {@link useErrorMessage}.
 */
export function useUnshareList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId }: UnshareListInput) => {
      const response = await unshareList({ path: { listId } });

      if (response.data) {
        return response.data;
      }

      throw response.error;
    },
    onSuccess: (_data, { listId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.detail(listId) });
    },
  });
}
