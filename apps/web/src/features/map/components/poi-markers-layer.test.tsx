import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PoiMarkersLayer } from "./poi-markers-layer";

import type { MapPoi } from "@/features/pois";

const fitBounds = vi.fn();
const flyTo = vi.fn();
const getZoom = vi.fn(() => 13);
const mapClickHandlers: Array<() => void> = [];

const useMapMock = vi.fn(
  (): {
    map: {
      fitBounds: typeof fitBounds;
      flyTo: typeof flyTo;
      getZoom: typeof getZoom;
      getContainer: () => HTMLElement;
      on: (event: string, handler: () => void) => void;
      off: (event: string, handler: () => void) => void;
    } | null;
  } => ({
    map: {
      fitBounds,
      flyTo,
      getZoom,
      getContainer: () => ({ clientWidth: 1024 }) as HTMLElement,
      on: (event, handler) => {
        if (event === "click") {
          mapClickHandlers.push(handler);
        }
      },
      off: (event, handler) => {
        if (event === "click") {
          const index = mapClickHandlers.indexOf(handler);
          if (index >= 0) {
            mapClickHandlers.splice(index, 1);
          }
        }
      },
    },
  })
);

type MarkerMock = {
  element: HTMLDivElement;
  setLngLat: ReturnType<typeof vi.fn>;
  addTo: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  setPopup: ReturnType<typeof vi.fn>;
  getElement: () => HTMLDivElement;
  getPopup: ReturnType<typeof vi.fn>;
  togglePopup: ReturnType<typeof vi.fn>;
};

const markerInstances: MarkerMock[] = [];

vi.mock("../context", () => ({
  useMap: () => useMapMock(),
}));

vi.mock("mapbox-gl", () => {
  class Marker {
    element: HTMLDivElement;
    setLngLat = vi.fn().mockReturnThis();
    addTo = vi.fn().mockReturnThis();
    remove = vi.fn();
    setPopup = vi.fn().mockReturnThis();
    togglePopup = vi.fn();
    getPopup = vi.fn(() => ({
      isOpen: () => false,
    }));

    constructor(options?: { element?: HTMLDivElement }) {
      this.element = options?.element ?? document.createElement("div");
      markerInstances.push(this);
    }

    getElement() {
      return this.element;
    }
  }

  class Popup {
    setText = vi.fn().mockReturnThis();
  }

  return { default: { Marker, Popup } };
});

const paris: MapPoi = { id: "paris", lat: 48.8566, lng: 2.3522, label: "Paris" };
const lyon: MapPoi = { id: "lyon", lat: 45.764, lng: 4.8357, label: "Lyon" };

describe("PoiMarkersLayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    markerInstances.length = 0;
    mapClickHandlers.length = 0;
    getZoom.mockReturnValue(13);
    useMapMock.mockReturnValue({
      map: {
        fitBounds,
        flyTo,
        getZoom,
        getContainer: () => ({ clientWidth: 1024 }) as HTMLElement,
        on: (event, handler) => {
          if (event === "click") {
            mapClickHandlers.push(handler);
          }
        },
        off: (event, handler) => {
          if (event === "click") {
            const index = mapClickHandlers.indexOf(handler);
            if (index >= 0) {
              mapClickHandlers.splice(index, 1);
            }
          }
        },
      },
    });
  });

  it("creates a marker per POI and fits bounds", () => {
    render(<PoiMarkersLayer pois={[paris, lyon]} />);

    expect(markerInstances).toHaveLength(2);
    expect(markerInstances[0].setLngLat).toHaveBeenCalledWith([2.3522, 48.8566]);
    expect(markerInstances[1].setLngLat).toHaveBeenCalledWith([4.8357, 45.764]);
    expect(fitBounds).toHaveBeenCalledWith(
      [
        [2.3522, 45.764],
        [4.8357, 48.8566],
      ],
      {
        padding: { left: 390, top: 80, right: 80, bottom: 80 },
        maxZoom: 15,
        duration: 800,
      }
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
      {
        padding: { left: 390, top: 80, right: 80, bottom: 80 },
        maxZoom: 15,
        duration: 800,
      }
    );
  });

  it("creates no markers when the map is not ready", () => {
    useMapMock.mockReturnValue({ map: null });

    render(<PoiMarkersLayer pois={[paris]} />);

    expect(markerInstances).toHaveLength(0);
    expect(fitBounds).not.toHaveBeenCalled();
  });

  it("does not refit when the same POIs are passed with a new array reference", () => {
    const { rerender } = render(<PoiMarkersLayer pois={[paris]} />);

    expect(fitBounds).toHaveBeenCalledTimes(1);

    rerender(<PoiMarkersLayer pois={[{ ...paris }]} />);

    expect(fitBounds).toHaveBeenCalledTimes(1);
    expect(markerInstances).toHaveLength(1);
    expect(markerInstances[0].remove).not.toHaveBeenCalled();
  });

  it("flies to the selected POI with a zoom floor", () => {
    render(<PoiMarkersLayer pois={[paris, lyon]} selectedPoiId="lyon" />);

    expect(flyTo).toHaveBeenCalledWith({
      center: [4.8357, 45.764],
      zoom: 15,
      padding: { left: 390, top: 80, right: 80, bottom: 80 },
      duration: 800,
    });
    expect(fitBounds).not.toHaveBeenCalled();
  });

  it("does not zoom out when the map is already closer than the floor", () => {
    getZoom.mockReturnValue(16);

    render(<PoiMarkersLayer pois={[paris]} selectedPoiId="paris" />);

    expect(flyTo).toHaveBeenCalledWith(
      expect.objectContaining({
        zoom: 16,
      })
    );
  });

  it("calls onSelectPoi when a marker is clicked", async () => {
    const user = userEvent.setup();
    const onSelectPoi = vi.fn();

    render(<PoiMarkersLayer pois={[paris]} onSelectPoi={onSelectPoi} />);

    await user.click(markerInstances[0].element);

    expect(onSelectPoi).toHaveBeenCalledWith("paris");
  });

  it("does not call onDeselect when a marker is clicked", async () => {
    const user = userEvent.setup();
    const onDeselect = vi.fn();
    const onSelectPoi = vi.fn();

    render(<PoiMarkersLayer pois={[paris]} onSelectPoi={onSelectPoi} onDeselect={onDeselect} />);

    await user.click(markerInstances[0].element);

    expect(onSelectPoi).toHaveBeenCalledWith("paris");
    expect(onDeselect).not.toHaveBeenCalled();
  });

  it("calls onDeselect when the map is clicked", () => {
    const onDeselect = vi.fn();

    render(<PoiMarkersLayer pois={[paris]} onDeselect={onDeselect} />);

    mapClickHandlers[0]();

    expect(onDeselect).toHaveBeenCalledTimes(1);
  });

  it("calls onDeselect when the selected POI disappears from the set", () => {
    const onDeselect = vi.fn();
    const { rerender } = render(
      <PoiMarkersLayer pois={[paris, lyon]} selectedPoiId="lyon" onDeselect={onDeselect} />
    );

    rerender(<PoiMarkersLayer pois={[paris]} selectedPoiId="lyon" onDeselect={onDeselect} />);

    expect(onDeselect).toHaveBeenCalledTimes(1);
  });
});
