import { describe, expect, it } from "vitest";

import type { SavedPoiListItem } from "../types/poi-display-types";

import { canEditSavedPoi } from "./can-edit-saved-poi";

const customPoi: SavedPoiListItem = {
  id: "sp-1",
  listId: "list-1",
  poiId: "poi-1",
  googlePlaceId: null,
  poi: {
    id: "poi-1",
    name: "Secret spot",
    createdBy: "user-1",
    latitude: 48.8566,
    longitude: 2.3522,
  },
};

const googlePoi: SavedPoiListItem = {
  id: "sp-2",
  listId: "list-1",
  poiId: null,
  googlePlaceId: "ChIJ",
  poi: undefined,
  googlePlaceCache: {
    placeId: "ChIJ",
    name: "Le Tout-Paris",
  },
};

describe("canEditSavedPoi", () => {
  it("returns true for a custom POI created by the user", () => {
    expect(canEditSavedPoi(customPoi, "user-1")).toBe(true);
  });

  it("returns false for a custom POI created by someone else", () => {
    expect(canEditSavedPoi(customPoi, "user-2")).toBe(false);
  });

  it("returns false for a Google Place", () => {
    expect(canEditSavedPoi(googlePoi, "user-1")).toBe(false);
  });

  it("returns false when the saved POI has no nested poi", () => {
    expect(canEditSavedPoi({ ...customPoi, poi: undefined }, "user-1")).toBe(false);
  });

  it("returns false when there is no user", () => {
    expect(canEditSavedPoi(customPoi, undefined)).toBe(false);
  });
});
