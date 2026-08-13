import { describe, expect, it } from "vitest";

import {
  getCoordinatesFromGooglePlace,
  getCoordinatesFromSavedPoi,
} from "./get-poi-coordinates";

describe("getCoordinatesFromGooglePlace", () => {
  it("returns MapPoi for a Google Place with valid coordinates", () => {
    expect(
      getCoordinatesFromGooglePlace({
        placeId: "ChIJLU7jZClu5kcR4PcOOO6p3I0",
        name: "Tour Eiffel",
        latitude: 48.8566,
        longitude: 2.3522,
      })
    ).toEqual({
      id: "ChIJLU7jZClu5kcR4PcOOO6p3I0",
      lat: 48.8566,
      lng: 2.3522,
      label: "Tour Eiffel",
    });
  });

  it("returns null for Google (0, 0) sentinel coordinates", () => {
    expect(
      getCoordinatesFromGooglePlace({
        placeId: "ChIJmissing",
        name: "Unknown place",
        latitude: 0,
        longitude: 0,
      })
    ).toBeNull();
  });

  it("returns null when lat/lng are undefined", () => {
    expect(
      getCoordinatesFromGooglePlace({
        placeId: "ChIJno-geo",
        name: "No coords",
      })
    ).toBeNull();
  });

  it("omits label when the name is empty", () => {
    expect(
      getCoordinatesFromGooglePlace({
        placeId: "ChIJno-name",
        name: "   ",
        latitude: 48.8566,
        longitude: 2.3522,
      })
    ).toEqual({
      id: "ChIJno-name",
      lat: 48.8566,
      lng: 2.3522,
    });
  });
});

describe("getCoordinatesFromSavedPoi", () => {
  it("maps a custom SavedPoi with coordinates", () => {
    expect(
      getCoordinatesFromSavedPoi({
        id: "sp-1",
        poiId: "poi-1",
        googlePlaceId: null,
        poi: {
          id: "poi-1",
          name: "Tour Eiffel",
          latitude: 48.8584,
          longitude: 2.2945,
        },
      })
    ).toEqual({
      id: "sp-1",
      lat: 48.8584,
      lng: 2.2945,
      label: "Tour Eiffel",
    });
  });

  it("maps a SavedPoi from Google Place cache", () => {
    expect(
      getCoordinatesFromSavedPoi({
        id: "sp-2",
        googlePlaceCache: {
          placeId: "ChIJ...",
          name: "Café de Flore",
          latitude: 48.8542,
          longitude: 2.3326,
        },
      })
    ).toEqual({
      id: "sp-2",
      lat: 48.8542,
      lng: 2.3326,
      label: "Café de Flore",
    });
  });

  it("returns null when SavedPoi has no geo", () => {
    expect(getCoordinatesFromSavedPoi({ id: "sp-4" })).toBeNull();
  });

  it("returns null when SavedPoi sources have no coordinates", () => {
    expect(
      getCoordinatesFromSavedPoi({
        id: "sp-5",
        poi: {
          id: "poi-5",
          name: "No address POI",
        },
      })
    ).toBeNull();
  });

  it("prefers googlePlaceCache over poi when both have coordinates", () => {
    expect(
      getCoordinatesFromSavedPoi({
        id: "sp-6",
        poi: {
          id: "poi-6",
          name: "Custom name",
          latitude: 48.86,
          longitude: 2.3,
        },
        googlePlaceCache: {
          placeId: "ChIJgoogle",
          name: "Google name",
          latitude: 48.8542,
          longitude: 2.3326,
        },
      })
    ).toEqual({
      id: "sp-6",
      lat: 48.8542,
      lng: 2.3326,
      label: "Google name",
    });
  });

  it("falls back to poi when googlePlaceCache is (0, 0)", () => {
    expect(
      getCoordinatesFromSavedPoi({
        id: "sp-7",
        poi: {
          id: "poi-7",
          name: "Custom fallback",
          latitude: 48.8584,
          longitude: 2.2945,
        },
        googlePlaceCache: {
          placeId: "ChIJzero",
          name: "Missing location",
          latitude: 0,
          longitude: 0,
        },
      })
    ).toEqual({
      id: "sp-7",
      lat: 48.8584,
      lng: 2.2945,
      label: "Custom fallback",
    });
  });
});
