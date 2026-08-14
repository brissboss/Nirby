import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  MAP_CREATE_POI_DEDUPE_MS,
  MAP_CREATE_POI_LONG_PRESS_MS,
  isPoiMarkerEventTarget,
  useMapCreatePoiGesture,
  type MapCreatePoiGestureEvent,
  type MapCreatePoiGestureMap,
} from "./use-map-create-poi-gesture";

type Handler = (event: MapCreatePoiGestureEvent) => void;

function createFakeMap(container: HTMLElement) {
  const listeners = new Map<string, Handler[]>();

  const map: MapCreatePoiGestureMap = {
    on: vi.fn((type: string, listener: Handler) => {
      const list = listeners.get(type) ?? [];
      list.push(listener);
      listeners.set(type, list);
    }),
    off: vi.fn((type: string, listener: Handler) => {
      const list = listeners.get(type) ?? [];
      listeners.set(
        type,
        list.filter((item) => item !== listener)
      );
    }),
    getContainer: () => container,
  };

  function emit(type: string, event: MapCreatePoiGestureEvent = {}) {
    for (const listener of listeners.get(type) ?? []) {
      listener(event);
    }
  }

  return { map, emit, listeners };
}

const paris = { lat: 48.8566, lng: 2.3522 };

describe("isPoiMarkerEventTarget", () => {
  it("returns true for a POI marker or its child", () => {
    const marker = document.createElement("div");
    marker.className = "nirby-poi-marker";
    const child = document.createElement("span");
    marker.appendChild(child);

    expect(isPoiMarkerEventTarget(marker)).toBe(true);
    expect(isPoiMarkerEventTarget(child)).toBe(true);
  });

  it("returns false for other elements", () => {
    expect(isPoiMarkerEventTarget(document.createElement("div"))).toBe(false);
    expect(isPoiMarkerEventTarget(null)).toBe(false);
  });
});

describe("useMapCreatePoiGesture", () => {
  const onPoint = vi.fn();
  let container: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    vi.clearAllMocks();
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    vi.useRealTimers();
    container.remove();
  });

  it("emits a point on contextmenu and prevents the browser menu", () => {
    const { map, emit } = createFakeMap(container);
    renderHook(() => useMapCreatePoiGesture(map, onPoint));

    const preventDefault = vi.fn();
    const originalPreventDefault = vi.fn();

    emit("contextmenu", {
      lngLat: paris,
      preventDefault,
      originalEvent: {
        preventDefault: originalPreventDefault,
        target: container,
      } as unknown as Event,
    });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(originalPreventDefault).toHaveBeenCalledTimes(1);
    expect(onPoint).toHaveBeenCalledWith({ latitude: paris.lat, longitude: paris.lng });
  });

  it("ignores contextmenu on a POI marker", () => {
    const { map, emit } = createFakeMap(container);
    renderHook(() => useMapCreatePoiGesture(map, onPoint));

    const marker = document.createElement("div");
    marker.className = "nirby-poi-marker";
    container.appendChild(marker);

    emit("contextmenu", {
      lngLat: paris,
      preventDefault: vi.fn(),
      originalEvent: { preventDefault: vi.fn(), target: marker } as unknown as Event,
    });

    expect(onPoint).not.toHaveBeenCalled();
  });

  it("emits a point after a long-press", () => {
    const { map, emit } = createFakeMap(container);
    renderHook(() => useMapCreatePoiGesture(map, onPoint));

    emit("touchstart", {
      lngLat: paris,
      originalEvent: {
        touches: [{ clientX: 10, clientY: 20 }],
        changedTouches: [],
        target: container,
      } as unknown as Event,
    });

    expect(onPoint).not.toHaveBeenCalled();

    vi.advanceTimersByTime(MAP_CREATE_POI_LONG_PRESS_MS);

    expect(onPoint).toHaveBeenCalledWith({ latitude: paris.lat, longitude: paris.lng });
  });

  it("cancels a long-press on dragstart", () => {
    const { map, emit } = createFakeMap(container);
    renderHook(() => useMapCreatePoiGesture(map, onPoint));

    emit("touchstart", {
      lngLat: paris,
      originalEvent: {
        touches: [{ clientX: 10, clientY: 20 }],
        changedTouches: [],
        target: container,
      } as unknown as Event,
    });
    emit("dragstart");
    vi.advanceTimersByTime(MAP_CREATE_POI_LONG_PRESS_MS);

    expect(onPoint).not.toHaveBeenCalled();
  });

  it("cancels a long-press when the finger moves past the threshold", () => {
    const { map, emit } = createFakeMap(container);
    renderHook(() => useMapCreatePoiGesture(map, onPoint));

    emit("touchstart", {
      lngLat: paris,
      originalEvent: {
        touches: [{ clientX: 10, clientY: 20 }],
        changedTouches: [],
        target: container,
      } as unknown as Event,
    });

    const nativeMove = new Event("touchmove");
    Object.defineProperty(nativeMove, "touches", {
      value: [{ clientX: 40, clientY: 20 }],
    });
    container.dispatchEvent(nativeMove);

    vi.advanceTimersByTime(MAP_CREATE_POI_LONG_PRESS_MS);

    expect(onPoint).not.toHaveBeenCalled();
  });

  it("does not emit twice when contextmenu follows a long-press", () => {
    const { map, emit } = createFakeMap(container);
    renderHook(() => useMapCreatePoiGesture(map, onPoint));

    emit("touchstart", {
      lngLat: paris,
      originalEvent: {
        touches: [{ clientX: 10, clientY: 20 }],
        changedTouches: [],
        target: container,
      } as unknown as Event,
    });
    vi.advanceTimersByTime(MAP_CREATE_POI_LONG_PRESS_MS);

    emit("contextmenu", {
      lngLat: paris,
      preventDefault: vi.fn(),
      originalEvent: { preventDefault: vi.fn(), target: container } as unknown as Event,
    });

    expect(onPoint).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(MAP_CREATE_POI_DEDUPE_MS);

    emit("contextmenu", {
      lngLat: { lat: 45.75, lng: 4.85 },
      preventDefault: vi.fn(),
      originalEvent: { preventDefault: vi.fn(), target: container } as unknown as Event,
    });

    expect(onPoint).toHaveBeenCalledTimes(2);
  });

  it("does not attach listeners when the map is not ready", () => {
    renderHook(() => useMapCreatePoiGesture(null, onPoint));

    expect(onPoint).not.toHaveBeenCalled();
  });
});
