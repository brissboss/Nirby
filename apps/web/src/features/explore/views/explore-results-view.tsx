"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { AddToListPicker, type AddToListTarget } from "../components/add-to-list-picker";
import { ExploreResultRow } from "../components/explore-result-row";
import { ExploreResultsSkeleton } from "../components/explore-results-skeleton";
import { ExploreEmpty, ExploreError, ExploreIdle } from "../components/explore-state";
import { usePoiListMembership } from "../hooks/use-poi-list-membership";
import { useSearchGooglePlaces } from "../hooks/use-search-google-places";

import { EXPLORE_MIN_QUERY_LENGTH, useShell } from "@/features/app-shell";
import { PoiMarkersLayer } from "@/features/map";
import { getCoordinatesFromGooglePlace, type MapPoi } from "@/features/pois";
import { useErrorMessage } from "@/hooks/use-error-message";

export function ExploreResultsView() {
  const tExplore = useTranslations("explore");
  const getErrorMessage = useErrorMessage();
  const { query, selectedPoiId, selectPoi, clearSelection } = useShell();
  const { data, isLoading, isError, error, refetch, isFetching } = useSearchGooglePlaces(query);
  const places = data?.places ?? [];
  const placeIds = places
    .map((place) => place.placeId)
    .filter((placeId): placeId is string => Boolean(placeId));
  const { data: membershipData } = usePoiListMembership(placeIds);
  const membership = membershipData?.membership ?? {};
  const mapPois = useMemo(() => {
    if (isError) return [];
    return (data?.places ?? [])
      .map(getCoordinatesFromGooglePlace)
      .filter((poi): poi is MapPoi => poi !== null);
  }, [isError, data?.places]);
  // A single picker for the whole list: mounting one per row would duplicate the lists query.
  const [target, setTarget] = useState<AddToListTarget | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  if (query.length < EXPLORE_MIN_QUERY_LENGTH) {
    return <ExploreIdle />;
  }

  // `keepPreviousData` keeps the previous results while a new query loads.
  const isRefreshing = isFetching && places.length > 0;

  function openPicker(next: AddToListTarget) {
    setTarget(next);
    setIsPickerOpen(true);
  }

  return (
    <div className="grid w-full min-w-0 gap-4 pb-4">
      <header>
        <h2 className="font-display text-lg font-semibold tracking-tight">
          {tExplore("results.title")}
        </h2>
        {isRefreshing ? (
          <p className="text-sm text-muted-foreground">{tExplore("search.loading")}</p>
        ) : null}
      </header>

      {isLoading ? <ExploreResultsSkeleton /> : null}

      {!isLoading && isError ? (
        <ExploreError message={getErrorMessage(error)} onRetry={() => refetch()} />
      ) : null}

      {!isLoading && !isError && places.length === 0 ? <ExploreEmpty /> : null}

      {places.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {places.map((place, index) => (
            <li key={place.placeId ?? `place-${index}`}>
              <ExploreResultRow
                place={place}
                savedListCount={place.placeId ? (membership[place.placeId]?.length ?? 0) : 0}
                onAddToList={openPicker}
                isSelected={place.placeId === selectedPoiId}
                onSelect={selectPoi}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {target ? (
        <AddToListPicker
          googlePlaceId={target.googlePlaceId}
          placeName={target.placeName}
          savedListIds={membership[target.googlePlaceId] ?? []}
          open={isPickerOpen}
          onOpenChange={setIsPickerOpen}
        />
      ) : null}

      <PoiMarkersLayer
        pois={mapPois}
        selectedPoiId={selectedPoiId}
        onSelectPoi={selectPoi}
        onDeselect={clearSelection}
      />
    </div>
  );
}
