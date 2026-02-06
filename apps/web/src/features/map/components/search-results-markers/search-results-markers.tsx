"use client";

import { useEffect, useRef } from "react";

import {
  computeBounds,
  FLY_TO_SELECTED_OPTIONS,
  placesToGeoJSON,
  SEARCH_RESULTS_FIT_BOUNDS_OPTIONS,
  SEARCH_RESULTS_LAYER_ID,
  SEARCH_RESULTS_LAYER_PAINT,
  SEARCH_RESULTS_SOURCE_ID,
} from "./search-results-markers.utils";

import { useSearchPlace } from "@/features/browse";
import { useMap, useMapSelection } from "@/features/map";
import { getPrimaryColorAsRgb } from "@/lib/color";

function useSearchResultsLayer() {
  const { map } = useMap();
  const { data } = useSearchPlace();
  const { setSelected, clearSelection } = useMapSelection();
  const layerAddedRef = useRef(false);

  useEffect(() => {
    if (!map || !data?.places?.length) return;

    const places = data.places.filter(
      (p): p is typeof p & { latitude: number; longitude: number } =>
        p.latitude != null && p.longitude != null
    );
    if (places.length === 0) return;

    const geojson = placesToGeoJSON(places);

    if (!map.getSource(SEARCH_RESULTS_SOURCE_ID)) {
      map.addSource(SEARCH_RESULTS_SOURCE_ID, { type: "geojson", data: geojson });
    } else {
      (map.getSource(SEARCH_RESULTS_SOURCE_ID) as mapboxgl.GeoJSONSource)?.setData(geojson);
    }

    if (!map.getLayer(SEARCH_RESULTS_LAYER_ID)) {
      const circleColor = getPrimaryColorAsRgb();
      map.addLayer({
        id: SEARCH_RESULTS_LAYER_ID,
        type: "circle",
        source: SEARCH_RESULTS_SOURCE_ID,
        paint: {
          ...SEARCH_RESULTS_LAYER_PAINT,
          "circle-color": circleColor,
          "circle-emissive-strength": 1,
        },
      });
      layerAddedRef.current = true;
    }

    const onMarkerClick = (
      e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }
    ) => {
      const placeId = e.features?.[0]?.properties?.placeId;
      if (placeId != null) setSelected(String(placeId), "search");
    };

    const onMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const onMouseLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    const onMapClick = (e: mapboxgl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [SEARCH_RESULTS_LAYER_ID],
      });
      if (features.length === 0) clearSelection();
    };

    map.on("click", SEARCH_RESULTS_LAYER_ID, onMarkerClick);
    map.on("mouseenter", SEARCH_RESULTS_LAYER_ID, onMouseEnter);
    map.on("mouseleave", SEARCH_RESULTS_LAYER_ID, onMouseLeave);
    map.on("click", onMapClick);

    const bounds = computeBounds(places);
    const fitTimer = setTimeout(() => {
      map.fitBounds(bounds, SEARCH_RESULTS_FIT_BOUNDS_OPTIONS);
    }, 0);

    return () => {
      clearTimeout(fitTimer);
      map.off("click", SEARCH_RESULTS_LAYER_ID, onMarkerClick);
      map.off("mouseenter", SEARCH_RESULTS_LAYER_ID, onMouseEnter);
      map.off("mouseleave", SEARCH_RESULTS_LAYER_ID, onMouseLeave);
      map.off("click", onMapClick);
      if (layerAddedRef.current && map.getLayer(SEARCH_RESULTS_LAYER_ID)) {
        map.removeLayer(SEARCH_RESULTS_LAYER_ID);
        map.removeSource(SEARCH_RESULTS_SOURCE_ID);
        layerAddedRef.current = false;
      }
    };
  }, [map, data?.places, setSelected, clearSelection]);
}

function useSearchResultsLayerSelectionStyle() {
  const { map } = useMap();
  const { selectedPoiId } = useMapSelection();

  useEffect(() => {
    if (!map || !map.getLayer(SEARCH_RESULTS_LAYER_ID)) return;

    if (selectedPoiId == null) {
      map.setPaintProperty(SEARCH_RESULTS_LAYER_ID, "circle-opacity", 1);
      map.setPaintProperty(SEARCH_RESULTS_LAYER_ID, "circle-radius", 8);
    } else {
      map.setPaintProperty(SEARCH_RESULTS_LAYER_ID, "circle-opacity", [
        "case",
        ["==", ["get", "placeId"], selectedPoiId],
        1,
        0.7,
      ]);
      map.setPaintProperty(SEARCH_RESULTS_LAYER_ID, "circle-radius", [
        "case",
        ["==", ["get", "placeId"], selectedPoiId],
        10,
        8,
      ]);
    }
  }, [map, selectedPoiId]);
}

function useFlyToSelectedPlace() {
  const { map } = useMap();
  const { data } = useSearchPlace();
  const { selectedPoiId, selectedSource } = useMapSelection();

  useEffect(() => {
    if (!map || !selectedPoiId || selectedSource !== "search" || !data?.places?.length) return;

    const place = data.places.find((p) => (p.placeId ?? "") === selectedPoiId);
    if (!place || place.latitude == null || place.longitude == null) return;

    map.flyTo({
      center: [place.longitude, place.latitude],
      ...FLY_TO_SELECTED_OPTIONS,
    });
  }, [map, selectedPoiId, selectedSource, data?.places]);
}

export function SearchResultsMarkers() {
  useSearchResultsLayer();
  useSearchResultsLayerSelectionStyle();
  useFlyToSelectedPlace();
  return null;
}
