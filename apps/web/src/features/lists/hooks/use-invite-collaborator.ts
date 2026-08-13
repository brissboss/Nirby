"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { inviteCollaborator } from "@/lib/api";
import type { InviteCollaboratorData } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

/** Payload for `POST /list/:listId/collaborators/invite`. */
export type InviteCollaboratorInput = {
  listId: string;
  body: InviteCollaboratorData["body"];
};

/**
 * Invites a collaborator to a list by email.
 *
 * On success, invalidates collaborators, list detail, and the list index.
 * API errors are thrown so they can be handled with {@link useErrorMessage}.
 */
export function useInviteCollaborator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, body }: InviteCollaboratorInput) => {
      const response = await inviteCollaborator({ path: { listId }, body });

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
