import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MapPoi } from "@/features/pois";

const fitBounds = vi.fn();
const useMapMock = vi.fn(() => ({ map: { fitBounds } }));

type MarkerMock = {
  setLngLat: ReturnType<typeof vi.fn>;
  addTo: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  setPopup: ReturnType<typeof vi.fn>;
};

const markerInstances: MarkerMock[] = [];

vi.mock("../context", () => ({
  useMap: () => useMapMock(),
}));

vi.mock("mapbox-gl", () => {
  class Marker {
    setLngLat = vi.fn().mockReturnThis();
    addTo = vi.fn().mockReturnThis();
    remove = vi.fn();
    setPopup = vi.fn().mockReturnThis();

    constructor() {
      markerInstances.push(this);
    }
  }

  class Popup {
    setText = vi.fn().mockReturnThis();
  }

  return { default: { Marker, Popup } };
});

import { PoiMarkersLayer } from "./poi-markers-layer";

const paris: MapPoi = { id: "paris", lat: 48.8566, lng: 2.3522, label: "Paris" };
const lyon: MapPoi = { id: "lyon", lat: 45.764, lng: 4.8357, label: "Lyon" };

describe("PoiMarkersLayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    markerInstances.length = 0;
    useMapMock.mockReturnValue({ map: { fitBounds } });
  });

  it("creates a marker per POI and fits bounds", () => {
    render(<PoiMarkersLayer pois={[paris, lyon]} />);

    expect(markerInstances).toHaveLength(2);
    expect(markerInstances[0].setLngLat).toHaveBeenCalledWith([2.3522, 48.8566]);
    expect(markerInstances[1].setLngLat).toHaveBeenCalledWith([4.8357, 45.764]);
    expect(markerInstances[0].addTo).toHaveBeenCalledWith({ fitBounds });
    expect(markerInstances[1].addTo).toHaveBeenCalledWith({ fitBounds });
    expect(fitBounds).toHaveBeenCalledWith(
      [
        [2.3522, 45.764],
        [4.8357, 48.8566],
      ],
      { padding: 80, maxZoom: 15, duration: 800 }
    );
  });

  it("removes markers on unmount", () => {
    const { unmount } = render(<PoiMarkersLayer pois={[paris]} />);

    unmount();

    expect(markerInstances[0].remove).toHaveBeenCalledTimes(1);
  });

  it("cleans up markers and skips fitBounds for an empty set", () => {
    const { rerender } = render(<PoiMarkersLayer pois={[paris]} />);

    expect(markerInstances).toHaveLength(1);
    expect(fitBounds).toHaveBeenCalledTimes(1);

    rerender(<PoiMarkersLayer pois={[]} />);

    expect(markerInstances[0].remove).toHaveBeenCalledTimes(1);
    expect(markerInstances).toHaveLength(1);
    expect(fitBounds).toHaveBeenCalledTimes(1);
  });

  it("replaces markers and refits when the set changes", () => {
    const { rerender } = render(<PoiMarkersLayer pois={[paris]} />);

    rerender(<PoiMarkersLayer pois={[lyon]} />);

    expect(markerInstances).toHaveLength(2);
    expect(markerInstances[0].remove).toHaveBeenCalledTimes(1);
    expect(markerInstances[1].setLngLat).toHaveBeenCalledWith([4.8357, 45.764]);
    expect(fitBounds).toHaveBeenLastCalledWith(
      [
        [4.8357, 45.764],
        [4.8357, 45.764],
      ],
      { padding: 80, maxZoom: 15, duration: 800 }
    );
  });

  it("creates no markers when the map is not ready", () => {
    useMapMock.mockReturnValue({ map: null });

    render(<PoiMarkersLayer pois={[paris]} />);

    expect(markerInstances).toHaveLength(0);
    expect(fitBounds).not.toHaveBeenCalled();
  });
});
