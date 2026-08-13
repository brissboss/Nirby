"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { generateEditLink } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

/** Payload for `POST /list/:listId/edit-link`. */
export type GenerateEditLinkInput = {
  listId: string;
};

/**
 * Generates an edit-invite link for a list.
 *
 * On success, invalidates the list index and the list detail (`editToken`).
 * API errors are thrown so they can be handled with {@link useErrorMessage}.
 */
export function useGenerateEditLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId }: GenerateEditLinkInput) => {
      const response = await generateEditLink({ path: { listId } });

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
