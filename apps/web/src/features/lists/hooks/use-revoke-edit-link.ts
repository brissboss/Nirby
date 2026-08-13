"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { revokeEditLink } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

/** Payload for `DELETE /list/:listId/edit-link`. */
export type RevokeEditLinkInput = {
  listId: string;
};

/**
 * Revokes the edit-invite link for a list.
 *
 * On success, invalidates the list index and the list detail (`editToken`).
 * API errors are thrown so they can be handled with {@link useErrorMessage}.
 */
export function useRevokeEditLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId }: RevokeEditLinkInput) => {
      const response = await revokeEditLink({ path: { listId } });

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
