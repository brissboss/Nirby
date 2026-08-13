"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";

import { EXPLORE_MIN_QUERY_LENGTH } from "@/features/app-shell";
import { useAuth } from "@/features/auth";
import { useMap } from "@/features/map";
import { searchGooglePlaces } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

function roundCoordinate(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Searches Google Places for the given query string.
 *
 * Biases results with `useMap().userPosition` when available.
 * API errors are thrown so they can be handled with {@link useErrorMessage}.
 */
export function useSearchGooglePlaces(query: string) {
  const { user } = useAuth();
  const { userPosition } = useMap();
  const locale = useLocale();
  const language = locale === "fr" ? "fr" : "en";
  const lat = userPosition ? roundCoordinate(userPosition.lat) : undefined;
  const lng = userPosition ? roundCoordinate(userPosition.lng) : undefined;

  return useQuery({
    queryKey: queryKeys.googlePlaces.search({ query, lat, lng, language }),
    enabled: Boolean(user) && query.length >= EXPLORE_MIN_QUERY_LENGTH,
    queryFn: async () => {
      const response = await searchGooglePlaces({
        body: {
          searchQuery: query,
          language,
          ...(lat !== undefined && lng !== undefined ? { lat, lng } : {}),
        },
      });

      if (response.data) {
        return response.data;
      }

      throw response.error;
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
}
