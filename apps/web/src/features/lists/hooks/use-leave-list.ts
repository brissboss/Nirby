"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { leaveList } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

/** Payload for `DELETE /list/:listId/collaborators/me`. */
export type LeaveListInput = {
  listId: string;
};

/**
 * Leaves a list as the current collaborator.
 *
 * On success, invalidates collaborators, list detail, and the list index.
 * API errors are thrown so they can be handled with {@link useErrorMessage}.
 */
export function useLeaveList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId }: LeaveListInput) => {
      const response = await leaveList({ path: { listId } });

      if (response.data) {
        return response.data;
      }

      throw response.error;
    },
    onSuccess: (_data, { listId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.collaborators.all(listId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.detail(listId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.all });
    },
  });
}
