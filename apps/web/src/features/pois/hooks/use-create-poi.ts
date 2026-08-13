"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createPoi } from "@/lib/api";
import type { CreatePoiData } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

/** Body payload for `POST /poi`. */
export type CreatePoiInput = CreatePoiData["body"];

/**
 * Creates a custom POI for the authenticated user.
 *
 * On success, invalidates all POI queries so a future `GET /poi` list refetches.
 * API errors are thrown so they can be handled with {@link useErrorMessage}.
 */
export function useCreatePoi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePoiInput) => {
      const response = await createPoi({ body: input });

      if (response.data) {
        return response.data;
      }

      throw response.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pois.all });
    },
  });
}
