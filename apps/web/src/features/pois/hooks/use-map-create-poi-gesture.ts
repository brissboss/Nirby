"use client";

import { useEffect, useRef } from "react";

export type MapCreatePoiPoint = {
  latitude: number;
  longitude: number;
};

export type MapCreatePoiGestureMap = {
  on: (type: string, listener: (event: MapCreatePoiGestureEvent) => void) => void;
  off: (type: string, listener: (event: MapCreatePoiGestureEvent) => void) => void;
  getContainer: () => HTMLElement;
};

export type MapCreatePoiGestureEvent = {
  lngLat?: { lat: number; lng: number };
  originalEvent?: Event;
  preventDefault?: () => void;
};

export const MAP_CREATE_POI_LONG_PRESS_MS = 500;
export const MAP_CREATE_POI_MOVE_THRESHOLD_PX = 10;
export const MAP_CREATE_POI_DEDUPE_MS = 600;

export function isPoiMarkerEventTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(".nirby-poi-marker") !== null;
}

function getTouchClient(event: Event): { clientX: number; clientY: number } | null {
  if (!("touches" in event) && !("changedTouches" in event)) {
    return null;
  }

  const touchEvent = event as TouchEvent;
  const touch = touchEvent.touches[0] ?? touchEvent.changedTouches[0];
  if (!touch) {
    return null;
  }

  return { clientX: touch.clientX, clientY: touch.clientY };
}

function exceedsMoveThreshold(
  start: { clientX: number; clientY: number },
  current: { clientX: number; clientY: number }
): boolean {
  const dx = current.clientX - start.clientX;
  const dy = current.clientY - start.clientY;
  return dx * dx + dy * dy > MAP_CREATE_POI_MOVE_THRESHOLD_PX * MAP_CREATE_POI_MOVE_THRESHOLD_PX;
}

/**
 * Desktop right-click and mobile long-press on the map, yielding a geographic point.
 * Ignores POI markers and dedupes iOS long-press + contextmenu.
 */
export function useMapCreatePoiGesture(
  map: MapCreatePoiGestureMap | null,
  onPoint: (point: MapCreatePoiPoint) => void
) {
  const onPointRef = useRef(onPoint);

  useEffect(() => {
    onPointRef.current = onPoint;
  }, [onPoint]);

  useEffect(() => {
    if (!map) {
      return;
    }

    let longPressTimer: ReturnType<typeof setTimeout> | null = null;
    let start: { clientX: number; clientY: number; point: MapCreatePoiPoint } | null = null;
    let lastEmitAt = 0;

    function clearLongPress() {
      if (longPressTimer !== null) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      start = null;
    }

    function emit(point: MapCreatePoiPoint) {
      const now = Date.now();
      if (now - lastEmitAt < MAP_CREATE_POI_DEDUPE_MS) {
        return;
      }
      lastEmitAt = now;
      clearLongPress();
      onPointRef.current(point);
    }

    function handleContextMenu(event: MapCreatePoiGestureEvent) {
      event.preventDefault?.();
      if (event.originalEvent && "preventDefault" in event.originalEvent) {
        event.originalEvent.preventDefault();
      }

      if (isPoiMarkerEventTarget(event.originalEvent?.target ?? null)) {
        return;
      }

      if (!event.lngLat) {
        return;
      }

      emit({ latitude: event.lngLat.lat, longitude: event.lngLat.lng });
    }

    function handleTouchStart(event: MapCreatePoiGestureEvent) {
      if (isPoiMarkerEventTarget(event.originalEvent?.target ?? null)) {
        return;
      }

      const originalEvent = event.originalEvent;
      if (
        originalEvent &&
        "touches" in originalEvent &&
        (originalEvent as TouchEvent).touches.length > 1
      ) {
        clearLongPress();
        return;
      }

      if (!event.lngLat) {
        return;
      }

      const client = originalEvent ? getTouchClient(originalEvent) : null;
      start = {
        clientX: client?.clientX ?? 0,
        clientY: client?.clientY ?? 0,
        point: { latitude: event.lngLat.lat, longitude: event.lngLat.lng },
      };

      if (longPressTimer !== null) {
        clearTimeout(longPressTimer);
      }

      longPressTimer = setTimeout(() => {
        if (start) {
          emit(start.point);
        }
      }, MAP_CREATE_POI_LONG_PRESS_MS);
    }

    function handleNativeTouchMove(event: Event) {
      if (!start) {
        return;
      }

      if (!("touches" in event)) {
        return;
      }

      const touchEvent = event as TouchEvent;
      if (touchEvent.touches.length > 1) {
        clearLongPress();
        return;
      }

      const client = getTouchClient(event);
      if (client && exceedsMoveThreshold(start, client)) {
        clearLongPress();
      }
    }

    const container = map.getContainer();

    map.on("contextmenu", handleContextMenu);
    map.on("touchstart", handleTouchStart);
    map.on("touchend", clearLongPress);
    map.on("touchcancel", clearLongPress);
    map.on("dragstart", clearLongPress);
    map.on("zoomstart", clearLongPress);
    container.addEventListener("touchmove", handleNativeTouchMove, { passive: true });

    return () => {
      clearLongPress();
      map.off("contextmenu", handleContextMenu);
      map.off("touchstart", handleTouchStart);
      map.off("touchend", clearLongPress);
      map.off("touchcancel", clearLongPress);
      map.off("dragstart", clearLongPress);
      map.off("zoomstart", clearLongPress);
      container.removeEventListener("touchmove", handleNativeTouchMove);
    };
  }, [map]);
}
