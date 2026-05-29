"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createList } from "@/lib/api";
import type { CreateListData } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

/** Body payload for `POST /list`. */
export type CreateListInput = CreateListData["body"];

/**
 * Creates a new list for the authenticated user.
 *
 * On success, invalidates all list queries so `useLists` refetches.
 * API errors are thrown so they can be handled with {@link useErrorMessage}.
 */
export function useCreateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateListInput) => {
      const response = await createList({ body: input });

      if (response.data) {
        return response.data;
      }

      throw response.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.all });
    },
  });
}
