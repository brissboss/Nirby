import {
  GetCollaboratorsData,
  GetListPoisData,
  GetListsData,
  GetPoisData,
  GetSharedListPoisData,
} from "./generated/types.gen";

import { ListPoisInfiniteFilters } from "@/features/lists/hooks/use-list-pois-infinite";
import type { ListsInfiniteFilters } from "@/features/lists/hooks/use-lists-infinite";

// Roots are declared outside `queryKeys` on purpose: referencing `queryKeys` inside its own
// initializer makes TypeScript infer `any`, which silently widens every `useQuery` result.
const GOOGLE_PLACES_ROOT = ["google-places"] as const;
const LISTS_ROOT = ["lists"] as const;
const POIS_ROOT = ["pois"] as const;
const SHARED_ROOT = ["shared"] as const;

const listPoisRoot = (listId: string) => [...LISTS_ROOT, "pois", listId] as const;
const listCollaboratorsRoot = (listId: string) => [...LISTS_ROOT, "collaborators", listId] as const;
const sharedPoisRoot = (shareToken: string) => [...SHARED_ROOT, "pois", shareToken] as const;

export const queryKeys = {
  googlePlaces: {
    all: GOOGLE_PLACES_ROOT,
    search: (params: { query: string; lat?: number; lng?: number; language: string }) =>
      [...GOOGLE_PLACES_ROOT, "search", params] as const,
  },
  lists: {
    all: LISTS_ROOT,
    list: (filters?: GetListsData["query"]) => [...LISTS_ROOT, "list", filters] as const,
    infinite: (filters?: ListsInfiniteFilters) => [...LISTS_ROOT, "infinite", filters] as const,
    detail: (listId: string) => [...LISTS_ROOT, "detail", listId] as const,
    poiMembership: {
      all: [...LISTS_ROOT, "poi-membership"] as const,
      byPlaces: (googlePlaceIds: string[]) =>
        [...LISTS_ROOT, "poi-membership", googlePlaceIds] as const,
    },
    pois: {
      all: listPoisRoot,
      list: (listId: string, filters?: GetListPoisData["query"]) =>
        [...listPoisRoot(listId), filters] as const,
      infinite: (listId: string, filters?: ListPoisInfiniteFilters) =>
        [...listPoisRoot(listId), "infinite", filters] as const,
    },
    collaborators: {
      all: listCollaboratorsRoot,
      list: (listId: string, filters?: GetCollaboratorsData["query"]) =>
        [...listCollaboratorsRoot(listId), filters] as const,
    },
  },
  pois: {
    all: POIS_ROOT,
    list: (filters?: GetPoisData["query"]) => [...POIS_ROOT, "list", filters] as const,
    detail: (poiId: string) => [...POIS_ROOT, "detail", poiId] as const,
  },
  shared: {
    all: SHARED_ROOT,
    detail: (shareToken: string) => [...SHARED_ROOT, "detail", shareToken] as const,
    pois: {
      infinite: (
        shareToken: string,
        filters?: Omit<NonNullable<GetSharedListPoisData["query"]>, "page">
      ) => [...sharedPoisRoot(shareToken), "infinite", filters] as const,
    },
  },
};
