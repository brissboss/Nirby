"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { removePoiFromList } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

/** Payload for `DELETE /list/:listId/poi/:savedPoiId`. */
export type RemovePoiFromListInput = {
  listId: string;
  savedPoiId: string;
};

/**
 * Removes a saved POI from a list.
 *
 * On success, invalidates the list's POI queries and list detail.
 * API errors are thrown so they can be handled with {@link useErrorMessage}.
 */
export function useRemovePoiFromList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, savedPoiId }: RemovePoiFromListInput) => {
      const response = await removePoiFromList({
        path: { listId, savedPoiId },
      });

      if (response.data) {
        return response.data;
      }

      throw response.error;
    },
    onSuccess: (_data, { listId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.pois.all(listId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.detail(listId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.all });
    },
  });
}
