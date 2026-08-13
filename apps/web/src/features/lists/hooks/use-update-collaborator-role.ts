"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateCollaboratorRole } from "@/lib/api";
import type { UpdateCollaboratorRoleData } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

/** Payload for `PUT /list/:listId/collaborators/:collaboratorId`. */
export type UpdateCollaboratorRoleInput = {
  listId: string;
  collaboratorId: string;
  body: UpdateCollaboratorRoleData["body"];
};

/**
 * Updates a collaborator's role on a list.
 *
 * On success, invalidates collaborators, list detail, and the list index.
 * API errors are thrown so they can be handled with {@link useErrorMessage}.
 */
export function useUpdateCollaboratorRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, collaboratorId, body }: UpdateCollaboratorRoleInput) => {
      const response = await updateCollaboratorRole({
        path: { listId, collaboratorId },
        body,
      });

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
