"use client";

import { useMemo } from "react";

import { useListPoisInfinite } from "./use-list-pois-infinite";

import { getCoordinatesFromSavedPoi, type MapPoi } from "@/features/pois";

export function useListMapPois(listId: string | undefined): MapPoi[] {
  const { data, isError } = useListPoisInfinite(listId);

  return useMemo(() => {
    if (isError) return [];

    return (data?.pages ?? [])
      .flatMap((page) => page.savedPois)
      .map(getCoordinatesFromSavedPoi)
      .filter((poi): poi is MapPoi => poi !== null);
  }, [isError, data?.pages]);
}
