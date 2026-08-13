import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useListMapPois } from "./use-list-map-pois";
import { useListPoisInfinite } from "./use-list-pois-infinite";

import type { SavedPoiListItem } from "@/features/pois";

vi.mock("./use-list-pois-infinite", () => ({
  useListPoisInfinite: vi.fn(),
}));

const customSavedPoi: SavedPoiListItem = {
  id: "sp-1",
  listId: "list-1",
  poiId: "poi-1",
  googlePlaceId: null,
  createdAt: "2024-01-01T00:00:00.000Z",
  poi: {
    id: "poi-1",
    name: "Fraktion",
    address: "16 rue de la Grange Batelière, Paris",
    category: "landmark",
    latitude: 48.87324153744834,
    longitude: 2.3412600502008014,
    photoUrls: [],
  },
  googlePlaceCache: undefined,
};

const googleSavedPoi: SavedPoiListItem = {
  id: "sp-2",
  listId: "list-1",
  poiId: null,
  googlePlaceId: "ChIJxYJUC2lv5kcRlhdpWba_aGU",
  createdAt: "2024-01-02T00:00:00.000Z",
  poi: undefined,
  googlePlaceCache: {
    placeId: "ChIJxYJUC2lv5kcRlhdpWba_aGU",
    name: "Le Tout-Paris",
    address: "8 Quai du Louvre, Paris",
    categoryDisplayName: "French Restaurant",
    latitude: 48.8587493,
    longitude: 2.3422529,
    photoReferences: [],
  },
};

const noGeoSavedPoi: SavedPoiListItem = {
  id: "sp-3",
  poi: {
    id: "poi-3",
    name: "No geo",
  },
};

const zeroZeroSavedPoi: SavedPoiListItem = {
  id: "sp-4",
  googlePlaceCache: {
    placeId: "ChIJzero",
    name: "Unknown",
    latitude: 0,
    longitude: 0,
  },
};

function mockInfinite(overrides: Partial<ReturnType<typeof useListPoisInfinite>> = {}) {
  vi.mocked(useListPoisInfinite).mockReturnValue({
    data: undefined,
    isError: false,
    ...overrides,
  } as ReturnType<typeof useListPoisInfinite>);
}

describe("useListMapPois", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("flattens infinite pages into MapPoi ids", () => {
    mockInfinite({
      data: {
        pages: [
          {
            savedPois: [customSavedPoi],
            pagination: { page: 1, limit: 20, total: 2, totalPages: 2 },
          },
          {
            savedPois: [googleSavedPoi],
            pagination: { page: 2, limit: 20, total: 2, totalPages: 2 },
          },
        ],
        pageParams: [1, 2],
      },
    });

    const { result } = renderHook(() => useListMapPois("list-1"));

    expect(result.current.map((poi) => poi.id)).toEqual(["sp-1", "sp-2"]);
  });

  it("maps a mix of custom POIs and Google cache", () => {
    mockInfinite({
      data: {
        pages: [
          {
            savedPois: [customSavedPoi, googleSavedPoi],
            pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
          },
        ],
        pageParams: [1],
      },
    });

    const { result } = renderHook(() => useListMapPois("list-1"));

    expect(result.current).toEqual([
      {
        id: "sp-1",
        lat: 48.87324153744834,
        lng: 2.3412600502008014,
        label: "Fraktion",
      },
      {
        id: "sp-2",
        lat: 48.8587493,
        lng: 2.3422529,
        label: "Le Tout-Paris",
      },
    ]);
  });

  it("ignores saved POIs without geo or with the (0, 0) sentinel", () => {
    mockInfinite({
      data: {
        pages: [
          {
            savedPois: [customSavedPoi, noGeoSavedPoi, zeroZeroSavedPoi],
            pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
          },
        ],
        pageParams: [1],
      },
    });

    const { result } = renderHook(() => useListMapPois("list-1"));

    expect(result.current.map((poi) => poi.id)).toEqual(["sp-1"]);
  });

  it("returns an empty list when the query errors", () => {
    mockInfinite({
      isError: true,
      data: {
        pages: [
          {
            savedPois: [customSavedPoi],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
          },
        ],
        pageParams: [1],
      },
    });

    const { result } = renderHook(() => useListMapPois("list-1"));

    expect(result.current).toEqual([]);
  });
});
