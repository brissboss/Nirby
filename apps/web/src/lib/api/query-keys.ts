import { GetListPoisData, GetListsData } from "./generated/types.gen";

import type { ListsInfiniteFilters } from "@/features/lists/hooks/use-lists-infinite";

export const queryKeys = {
  lists: {
    all: ["lists"] as const,
    list: (filters?: GetListsData["query"]) => [...queryKeys.lists.all, "list", filters] as const,
    infinite: (filters?: ListsInfiniteFilters) =>
      [...queryKeys.lists.all, "infinite", filters] as const,
    detail: (listId: string) => [...queryKeys.lists.all, "detail", listId] as const,
    pois: {
      all: (listId: string) => [...queryKeys.lists.all, "pois", listId] as const,
      list: (listId: string, filters?: GetListPoisData["query"]) =>
        [...queryKeys.lists.pois.all(listId), filters] as const,
    },
  },
};
