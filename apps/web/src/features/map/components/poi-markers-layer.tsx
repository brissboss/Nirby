"use client";

import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";

import { useMap } from "../context";
import { getMapPoiBounds } from "../utils/map-bounds";
import { getShellViewportPadding, getSelectedPoiZoom } from "../utils/map-camera";
import { createPoiMarkerElement } from "../utils/poi-marker-element";

import type { MapPoi } from "@/features/pois";

type PoiMarkersLayerProps = {
  pois: MapPoi[];
  selectedPoiId?: string | null;
  onSelectPoi?: (id: string) => void;
  onDeselect?: () => void;
};

function getPoisKey(pois: MapPoi[]): string {
  return pois.map((poi) => `${poi.id}:${poi.lat}:${poi.lng}`).join("|");
}

export function PoiMarkersLayer({
  pois,
  selectedPoiId = null,
  onSelectPoi,
  onDeselect,
}: PoiMarkersLayerProps) {
  const { map } = useMap();
  const poisRef = useRef(pois);
  const poisKey = getPoisKey(pois);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const onSelectPoiRef = useRef(onSelectPoi);
  const onDeselectRef = useRef(onDeselect);
  const selectedPoiIdRef = useRef(selectedPoiId);

  useEffect(() => {
    poisRef.current = pois;
  }, [pois]);

  useEffect(() => {
    onSelectPoiRef.current = onSelectPoi;
  }, [onSelectPoi]);

  useEffect(() => {
    onDeselectRef.current = onDeselect;
  }, [onDeselect]);

  useEffect(() => {
    selectedPoiIdRef.current = selectedPoiId;
  }, [selectedPoiId]);

  useEffect(() => {
    if (!map) return;

    const currentPois = poisRef.current;
    const markers = new Map<string, mapboxgl.Marker>();

    currentPois.forEach((poi) => {
      const element = createPoiMarkerElement(poi.label);
      element.addEventListener("click", (event) => {
        event.stopPropagation();
        onSelectPoiRef.current?.(poi.id);
      });

      const marker = new mapboxgl.Marker({ element }).setLngLat([poi.lng, poi.lat]);

      if (poi.label) {
        marker.setPopup(new mapboxgl.Popup({ closeButton: false, offset: 18 }).setText(poi.label));
      }

      marker.addTo(map);
      markers.set(poi.id, marker);
    });

    markersRef.current = markers;

    const bounds = getMapPoiBounds(currentPois);
    if (bounds && !selectedPoiIdRef.current) {
      const padding = getShellViewportPadding(map.getContainer());
      map.fitBounds(bounds, { padding, maxZoom: 15, duration: 800 });
    }

    return () => {
      markers.forEach((marker) => marker.remove());
      markersRef.current = new Map();
    };
  }, [map, poisKey]);

  useEffect(() => {
    if (!map) return;

    const handleMapClick = () => {
      onDeselectRef.current?.();
    };

    map.on("click", handleMapClick);

    return () => {
      map.off("click", handleMapClick);
    };
  }, [map]);

  useEffect(() => {
    if (!map) return;

    markersRef.current.forEach((marker, id) => {
      const element = marker.getElement();
      element.classList.toggle("nirby-poi-marker--selected", id === selectedPoiId);

      const popup = marker.getPopup();
      if (!popup) return;

      if (id === selectedPoiId) {
        if (!popup.isOpen()) {
          marker.togglePopup();
        }
      } else if (popup.isOpen()) {
        marker.togglePopup();
      }
    });
  }, [map, selectedPoiId, poisKey]);

  useEffect(() => {
    if (!map || !selectedPoiId) return;

    const poi = poisRef.current.find((item) => item.id === selectedPoiId);
    if (!poi) {
      onDeselectRef.current?.();
      return;
    }

    const padding = getShellViewportPadding(map.getContainer());
    const zoom = getSelectedPoiZoom(map.getZoom());

    map.flyTo({
      center: [poi.lng, poi.lat],
      zoom,
      padding,
      duration: 800,
    });
  }, [map, selectedPoiId, poisKey]);

  return null;
}
