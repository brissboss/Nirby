"use client";

import { useQuery } from "@tanstack/react-query";

import { getSharedList } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

/**
 * Fetches a public shared list by share token. No auth gate — `GET /shared/:shareToken` is public.
 *
 * The query is disabled until `shareToken` is defined.
 * API errors are thrown so they can be handled with {@link useErrorMessage}.
 */
export function useSharedList(shareToken: string | undefined) {
  return useQuery({
    queryKey: queryKeys.shared.detail(shareToken ?? ""),
    enabled: Boolean(shareToken),
    queryFn: async () => {
      if (!shareToken) {
        throw new Error("shareToken is required");
      }

      const response = await getSharedList({ path: { shareToken } });

      if (response.data) {
        return response.data;
      }

      throw response.error;
    },
  });
}
