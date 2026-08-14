"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updatePoi } from "@/lib/api";
import type { UpdatePoiData } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

/** Payload for `PUT /poi/:id`. */
export type UpdatePoiInput = {
  poiId: string;
  listId?: string;
  body: UpdatePoiData["body"];
};

/**
 * Updates a custom POI owned by the authenticated user.
 *
 * On success, invalidates POI queries and, when `listId` is set, that list's POI queries.
 * API errors are thrown so they can be handled with {@link useErrorMessage}.
 */
export function useUpdatePoi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ poiId, body }: UpdatePoiInput) => {
      const response = await updatePoi({ path: { id: poiId }, body });

      if (response.data) {
        return response.data;
      }

      throw response.error;
    },
    onSuccess: (_data, { poiId, listId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pois.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.pois.detail(poiId) });

      if (listId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.lists.pois.all(listId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.lists.detail(listId) });
      }
    },
  });
}
