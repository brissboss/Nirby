"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { joinListByEditLink } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

/** Payload for `POST /list/join?editToken=`. */
export type JoinListByEditLinkInput = {
  editToken: string;
};

/**
 * Joins a list using an edit-invite token.
 *
 * On success, invalidates the list index and the joined list detail.
 * API errors are thrown so they can be handled with {@link useErrorMessage}.
 */
export function useJoinListByEditLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ editToken }: JoinListByEditLinkInput) => {
      const response = await joinListByEditLink({ query: { editToken } });

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
