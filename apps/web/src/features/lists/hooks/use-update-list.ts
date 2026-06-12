"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateList } from "@/lib/api";
import type { UpdateListData } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

/** Payload for `PUT /list/:listId`. */
export type UpdateListInput = {
  listId: string;
  body: UpdateListData["body"];
};

/**
 * Updates an existing list owned by the authenticated user.
 *
 * On success, invalidates the list index and the updated list detail.
 * API errors are thrown so they can be handled with {@link useErrorMessage}.
 */
export function useUpdateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, body }: UpdateListInput) => {
      const response = await updateList({ path: { listId }, body });

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
