import { describe, expect, it } from "vitest";

import { getMapPoiBounds } from "./map-bounds";

describe("getMapPoiBounds", () => {
  it("returns null for an empty set", () => {
    expect(getMapPoiBounds([])).toBeNull();
  });

  it("returns a degenerate bbox for a single POI", () => {
    expect(getMapPoiBounds([{ id: "paris", lat: 48.8566, lng: 2.3522, label: "Paris" }])).toEqual([
      [2.3522, 48.8566],
      [2.3522, 48.8566],
    ]);
  });

  it("returns min/max lng/lat for multiple POIs", () => {
    expect(
      getMapPoiBounds([
        { id: "paris", lat: 48.8566, lng: 2.3522 },
        { id: "lyon", lat: 45.764, lng: 4.8357 },
      ])
    ).toEqual([
      [2.3522, 45.764],
      [4.8357, 48.8566],
    ]);
  });
});
