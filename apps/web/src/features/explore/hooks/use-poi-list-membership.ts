"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useAuth } from "@/features/auth";
import { getPoiListMembership } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

/** Deduplicates and sorts place IDs so the query key stays stable across renders. */
export function normalizeGooglePlaceIds(googlePlaceIds: string[]): string[] {
  return [...new Set(googlePlaceIds)].sort();
}

/**
 * Returns which of the current user's lists already contain each Google place.
 *
 * API errors are thrown so they can be handled with {@link useErrorMessage}.
 */
export function usePoiListMembership(googlePlaceIds: string[]) {
  const { user } = useAuth();
  const normalizedIds = useMemo(() => normalizeGooglePlaceIds(googlePlaceIds), [googlePlaceIds]);

  return useQuery({
    queryKey: queryKeys.lists.poiMembership.byPlaces(normalizedIds),
    enabled: Boolean(user) && normalizedIds.length > 0,
    queryFn: async () => {
      const response = await getPoiListMembership({
        body: { googlePlaceIds: normalizedIds },
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
