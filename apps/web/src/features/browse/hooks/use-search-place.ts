"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { searchGooglePlaces } from "@/lib/api";
import type { SearchGooglePlacesResponse } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

export type SearchPlacesVariables = {
  searchQuery: string;
  language?: "fr" | "en";
  lat?: number;
  lng?: number;
};

export function useSearchPlace() {
  const queryClient = useQueryClient();

  const mutation = useMutation<SearchGooglePlacesResponse, Error, SearchPlacesVariables>({
    mutationFn: async (variables) => {
      const response = await searchGooglePlaces({
        body: {
          searchQuery: variables.searchQuery,
          language: variables.language,
          lat: variables.lat,
          lng: variables.lng,
        },
      });
      if (response.error) throw response.error;
      return response.data!;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(queryKeys.places.search(variables.searchQuery), data);
      queryClient.setQueryData(queryKeys.places.lastSearch, data);
      queryClient.setQueryData(queryKeys.places.lastSearchQuery, variables.searchQuery);
    },
  });

  // Cache-only: filled by mutation on success
  const query = useQuery<SearchGooglePlacesResponse>({
    queryKey: queryKeys.places.lastSearch,
    queryFn: () => ({ places: [] }),
    staleTime: Infinity,
  });

  // Cache-only: filled by mutation on success
  const lastSearchQuery = useQuery<string>({
    queryKey: queryKeys.places.lastSearchQuery,
    queryFn: () => "",
    staleTime: Infinity,
  });

  const setLastSearchQueryText = (text: string) => {
    queryClient.setQueryData(queryKeys.places.lastSearchQuery, text);
  };

  const clearResults = () => {
    queryClient.setQueryData(queryKeys.places.lastSearch, { places: [] });
    queryClient.setQueryData(queryKeys.places.lastSearchQuery, "");
  };

  return {
    ...mutation,
    data: query.data,
    lastSearchQueryText: lastSearchQuery.data,
    setLastSearchQueryText,
    clearResults,
  };
}
