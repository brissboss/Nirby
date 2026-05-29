import { GetListsData } from "./generated/types.gen";

export const queryKeys = {
  lists: {
    all: ["lists"] as const,
    list: (filters?: GetListsData["query"]) => [...queryKeys.lists.all, "list", filters] as const,
    detail: (listId: string) => [...queryKeys.lists.all, "detail", listId] as const,
  },
};
