"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { joinListByInvite } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

/** Payload for `POST /list/:listId/collaborators/join?token=`. */
export type JoinListByInviteInput = {
  listId: string;
  token: string;
};

/**
 * Accepts an email invitation and joins a list.
 *
 * On success, invalidates the list index and the joined list detail.
 * API errors are thrown so they can be handled with {@link useErrorMessage}.
 */
export function useJoinListByInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, token }: JoinListByInviteInput) => {
      const response = await joinListByInvite({
        path: { listId },
        query: { token },
      });

      if (response.data) {
        return response.data;
      }

      throw response.error;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.detail(data.list.id) });
    },
  });
}
