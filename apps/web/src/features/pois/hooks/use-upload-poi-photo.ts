"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { uploadPoiPhoto } from "@/lib/api";
import type { UploadPoiPhotoData } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

/** Body payload for `POST /upload/poi-photo`. */
export type UploadPoiPhotoInput = UploadPoiPhotoData["body"];

/**
 * Uploads a photo for a custom POI.
 *
 * When `poiId` is provided, invalidates that POI detail and all POI queries.
 * API errors are thrown so they can be handled with {@link useErrorMessage}.
 */
export function useUploadPoiPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UploadPoiPhotoInput) => {
      const response = await uploadPoiPhoto({ body: input });

      if (response.data) {
        return response.data;
      }

      throw response.error;
    },
    onSuccess: (_data, { poiId }) => {
      if (!poiId) {
        return;
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.pois.detail(poiId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.pois.all });
    },
  });
}
