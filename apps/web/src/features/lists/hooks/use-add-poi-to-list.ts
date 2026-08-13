"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { addPoiToList } from "@/lib/api";
import type { AddPoiToListData } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

/** Payload for `POST /list/:listId/poi`. */
export type AddPoiToListInput = {
  listId: string;
  body: AddPoiToListData["body"];
};

/**
 * Adds a POI (custom or Google Place) to a list.
 *
 * On success, invalidates the list's POI queries and list detail.
 * API errors are thrown so they can be handled with {@link useErrorMessage}.
 */
export function useAddPoiToList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, body }: AddPoiToListInput) => {
      const response = await addPoiToList({ path: { listId }, body });

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
