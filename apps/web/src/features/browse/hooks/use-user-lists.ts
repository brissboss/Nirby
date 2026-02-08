"use client";

import { useQuery } from "@tanstack/react-query";

import { getLists } from "@/lib/api";
import type { GetListsResponse } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

export function useUserLists(enabled = true) {
  return useQuery<GetListsResponse>({
    queryKey: queryKeys.lists.all,
    queryFn: async () => {
      const response = await getLists();
      if (response.error) throw response.error;
      return response.data!;
    },
    enabled,
  });
}
