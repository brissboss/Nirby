"use client";

import mapboxgl from "mapbox-gl";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  useMapCreatePoiGesture,
  type MapCreatePoiGestureMap,
  type MapCreatePoiPoint,
} from "../hooks/use-map-create-poi-gesture";

import { CreatePoiDialog } from "./create-poi-dialog";

import {
  canEditList,
  LIST_ID_PARAM,
  parseListId,
} from "@/features/lists/constants/lists.constants";
import { useList } from "@/features/lists/hooks/use-list";
import { useMap } from "@/features/map/context";
import { createPoiMarkerElement } from "@/features/map/utils/poi-marker-element";

/** Dispatched by e2e to open the create-POI form without a Mapbox gesture. */
export const CREATE_POI_AT_EVENT = "nirby:create-poi-at";

/** Map gesture entry for custom POI create: right-click (desktop) / long-press (mobile). */
export function CreatePoiFromMap() {
  const { map } = useMap();
  const searchParams = useSearchParams();
  const listIdFromUrl = parseListId(searchParams.get(LIST_ID_PARAM));
  const { data } = useList(listIdFromUrl ?? undefined);
  const listId = canEditList(data?.list.role) ? (listIdFromUrl ?? undefined) : undefined;

  const [draft, setDraft] = useState<MapCreatePoiPoint | null>(null);

  const handlePoint = useCallback((point: MapCreatePoiPoint) => {
    setDraft(point);
  }, []);

  useMapCreatePoiGesture(map as MapCreatePoiGestureMap | null, handlePoint);

  useEffect(() => {
    function onCreatePoiAt(event: Event) {
      const detail = (event as CustomEvent<Partial<MapCreatePoiPoint>>).detail;
      if (typeof detail?.latitude !== "number" || typeof detail?.longitude !== "number") {
        return;
      }
      if (!Number.isFinite(detail.latitude) || !Number.isFinite(detail.longitude)) {
        return;
      }
      setDraft({ latitude: detail.latitude, longitude: detail.longitude });
    }

    window.addEventListener(CREATE_POI_AT_EVENT, onCreatePoiAt);
    return () => window.removeEventListener(CREATE_POI_AT_EVENT, onCreatePoiAt);
  }, []);

  useEffect(() => {
    if (!map || !draft) {
      return;
    }

    const element = createPoiMarkerElement();
    element.classList.add("nirby-poi-marker--draft");
    element.setAttribute("aria-hidden", "true");

    const marker = new mapboxgl.Marker({ element })
      .setLngLat([draft.longitude, draft.latitude])
      .addTo(map);

    return () => {
      marker.remove();
    };
  }, [map, draft]);

  if (!draft) {
    return null;
  }

  return (
    <CreatePoiDialog
      open
      onOpenChange={(open) => {
        if (!open) {
          setDraft(null);
        }
      }}
      coordinates={draft}
      listId={listId}
    />
  );
}
