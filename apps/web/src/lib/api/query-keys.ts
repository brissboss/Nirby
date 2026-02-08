export const queryKeys = {
  lists: {
    all: ["lists"],
    detail: (id: string) => ["list", id] as const,
    pois: (listId: string) => ["list", listId, "pois"] as const,
  },
  places: {
    search: (query: string) => ["places", "search", query] as const,
    lastSearchQuery: ["places", "lastSearchQuery"] as const,
    lastSearch: ["places", "lastSearch"] as const,
    lastSearchLocation: ["places", "lastSearchLocation"] as const,
  },
};
