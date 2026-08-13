import { describe, expect, it } from "vitest";

import { SELECTED_POI_MIN_ZOOM, getSelectedPoiZoom, getShellViewportPadding } from "./map-camera";

describe("getSelectedPoiZoom", () => {
  it("raises the zoom to the minimum floor when the map is zoomed out", () => {
    expect(getSelectedPoiZoom(10)).toBe(SELECTED_POI_MIN_ZOOM);
  });

  it("keeps the current zoom when already closer than the floor", () => {
    expect(getSelectedPoiZoom(16)).toBe(16);
  });
});

describe("getShellViewportPadding", () => {
  it("reserves space for the desktop sidebar", () => {
    const container = { clientWidth: 1024 } as HTMLElement;

    expect(getShellViewportPadding(container)).toEqual({
      left: 390,
      top: 80,
      right: 80,
      bottom: 80,
    });
  });

  it("reserves space for the mobile bottom chrome", () => {
    const container = { clientWidth: 375 } as HTMLElement;

    expect(getShellViewportPadding(container)).toEqual({
      bottom: 96,
      top: 80,
      left: 24,
      right: 24,
    });
  });
});
