import { describe, expect, it } from "vitest";

import { getPoiDisplayDataFromSavedPoi } from "./get-poi-display-data";

import type { Poi } from "@/lib/api";

describe("getPoiDisplayDataFromSavedPoi", () => {
  it("maps a custom POI", () => {
    expect(
      getPoiDisplayDataFromSavedPoi({
        id: "sp-1",
        poiId: "poi-1",
        googlePlaceId: null,
        poi: {
          id: "poi-1",
          name: "Tour Eiffel",
          address: "Champ de Mars, Paris",
          category: "monument",
          photoUrls: ["https://example.com/eiffel.jpg"],
          openingHours: [
            {
              open: { day: 1, hour: 9, minute: 0 },
              close: { day: 1, hour: 18, minute: 0 },
            },
          ] as unknown as Poi["openingHours"],
        },
      })
    ).toMatchObject({
      id: "sp-1",
      name: "Tour Eiffel",
      address: "Champ de Mars, Paris",
      category: "monument",
      source: "custom",
      photo: { kind: "url", url: "https://example.com/eiffel.jpg" },
      openingHours: {
        isOpen: expect.any(Boolean),
        nextOpenAt: expect.anything(),
      },
    });
  });

  it("maps a Google Place with photo and openNow", () => {
    expect(
      getPoiDisplayDataFromSavedPoi({
        id: "sp-2",
        googlePlaceCache: {
          placeId: "ChIJ...",
          name: "Café de Flore",
          address: "172 Bd Saint-Germain, Paris",
          categoryDisplayName: "Café",
          photoReferences: ["places/abc/photos/ref1"],
          openingHours: {
            openNow: true,
            weekdayDescriptions: ["Monday: 7:00 AM – 1:00 AM", "Tuesday: Closed"],
          },
        },
      })
    ).toMatchObject({
      id: "sp-2",
      name: "Café de Flore",
      source: "google",
      photo: { kind: "google-ref", photoRef: "places/abc/photos/ref1" },
      openingHours: {
        isOpen: true,
        nextOpenAt: null,
      },
    });
  });

  it("returns null address when missing", () => {
    expect(
      getPoiDisplayDataFromSavedPoi({
        id: "sp-3",
        poi: {
          id: "poi-3",
          name: "No address POI",
        },
      })
    ).toMatchObject({
      address: null,
      photo: null,
      openingHours: null,
    });
  });

  it("returns null when saved POI has no poi nor googlePlaceCache", () => {
    expect(getPoiDisplayDataFromSavedPoi({ id: "sp-4" })).toBeNull();
  });

  it("prefers googlePlaceCache over poi when both are present", () => {
    expect(
      getPoiDisplayDataFromSavedPoi({
        id: "sp-5",
        poi: {
          id: "poi-5",
          name: "Custom name",
        },
        googlePlaceCache: {
          placeId: "ChIJgoogle",
          name: "Google name",
        },
      })
    ).toMatchObject({
      name: "Google name",
      source: "google",
    });
  });
});
