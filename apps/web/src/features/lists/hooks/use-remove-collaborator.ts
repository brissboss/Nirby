"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { removeCollaborator } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

/** Payload for `DELETE /list/:listId/collaborators/:collaboratorId`. */
export type RemoveCollaboratorInput = {
  listId: string;
  collaboratorId: string;
};

/**
 * Removes a collaborator from a list.
 *
 * On success, invalidates collaborators, list detail, and the list index.
 * API errors are thrown so they can be handled with {@link useErrorMessage}.
 */
export function useRemoveCollaborator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, collaboratorId }: RemoveCollaboratorInput) => {
      const response = await removeCollaborator({ path: { listId, collaboratorId } });

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
