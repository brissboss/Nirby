import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSearchGooglePlaces } from "../hooks/use-search-google-places";

import { ExploreResultsView } from "./explore-results-view";

const defaultShellState = {
  query: "café",
  selectedPoiId: null,
  selectPoi: vi.fn(),
  clearSelection: vi.fn(),
};

const mockUseShell = vi.fn(() => defaultShellState);

vi.mock("../hooks/use-search-google-places", () => ({
  useSearchGooglePlaces: vi.fn(),
}));

vi.mock("../hooks/use-poi-list-membership", () => ({
  usePoiListMembership: vi.fn(() => ({ data: { membership: {} } })),
}));

vi.mock("@/features/app-shell", () => ({
  EXPLORE_MIN_QUERY_LENGTH: 2,
  useShell: () => mockUseShell(),
}));

vi.mock("@/hooks/use-error-message", () => ({
  useErrorMessage: () => () => "API error message",
}));

vi.mock("../components/explore-result-row", () => ({
  ExploreResultRow: ({
    place,
    onAddToList,
  }: {
    place: { placeId: string; name: string };
    onAddToList: (target: { googlePlaceId: string; placeName: string }) => void;
  }) => (
    <button
      type="button"
      onClick={() => onAddToList({ googlePlaceId: place.placeId, placeName: place.name })}
    >
      {place.name}
    </button>
  ),
}));

vi.mock("../components/add-to-list-picker", () => ({
  AddToListPicker: ({ placeName, open }: { placeName: string; open: boolean }) =>
    open ? <div>picker for {placeName}</div> : null,
}));

vi.mock("@/features/map", () => ({
  PoiMarkersLayer: ({
    pois,
    selectedPoiId,
    onSelectPoi,
    onDeselect,
  }: {
    pois: { id: string }[];
    selectedPoiId?: string | null;
    onSelectPoi?: (id: string) => void;
    onDeselect?: () => void;
  }) => (
    <div
      data-testid="poi-markers-layer"
      data-ids={pois.map((poi) => poi.id).join(",")}
      data-selected={selectedPoiId ?? ""}
      data-has-select={onSelectPoi ? "1" : "0"}
      data-has-deselect={onDeselect ? "1" : "0"}
    />
  ),
}));

type SearchResult = ReturnType<typeof useSearchGooglePlaces>;

function mockSearch(overrides: Partial<Record<keyof SearchResult, unknown>>) {
  vi.mocked(useSearchGooglePlaces).mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
    ...overrides,
  } as unknown as SearchResult);
}

describe("ExploreResultsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseShell.mockReturnValue({ ...defaultShellState, query: "café" });
  });

  it("shows the idle state when the query is too short", () => {
    mockUseShell.mockReturnValue({ ...defaultShellState, query: "c" });
    mockSearch({});

    render(<ExploreResultsView />);

    expect(screen.getByText("idle.title")).toBeInTheDocument();
  });

  it("shows a skeleton while loading", () => {
    mockSearch({ isLoading: true, isFetching: true });

    render(<ExploreResultsView />);

    expect(screen.getByLabelText("search.loading")).toBeInTheDocument();
  });

  it("shows the empty state when no place is returned", () => {
    mockSearch({ data: { places: [] } });

    render(<ExploreResultsView />);

    expect(screen.getByText("results.empty.title")).toBeInTheDocument();
  });

  it("shows the error state with a retry action", async () => {
    const refetch = vi.fn();
    mockSearch({ isError: true, error: { error: { code: "GOOGLE_PLACE_SEARCH_ERROR" } }, refetch });
    const user = userEvent.setup();

    render(<ExploreResultsView />);

    expect(screen.getByText("results.error.title")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "results.error.retry" }));
    expect(refetch).toHaveBeenCalled();
  });

  it("opens a single picker for the selected place", async () => {
    mockSearch({
      data: {
        places: [
          { placeId: "p1", name: "Tour Eiffel", address: "Paris" },
          { placeId: "p2", name: "Louvre", address: "Paris" },
        ],
      },
    });
    const user = userEvent.setup();

    render(<ExploreResultsView />);

    expect(screen.queryByText(/^picker for/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Louvre" }));

    expect(screen.getByText("picker for Louvre")).toBeInTheDocument();
  });

  it("passes geolocated places to the markers layer", () => {
    mockSearch({
      data: {
        places: [
          { placeId: "ChIJeiffel", name: "Tour Eiffel", latitude: 48.8584, longitude: 2.2945 },
          { placeId: "ChIJlouvre", name: "Louvre", latitude: 48.8606, longitude: 2.3376 },
        ],
      },
    });

    render(<ExploreResultsView />);

    expect(screen.getByTestId("poi-markers-layer")).toHaveAttribute(
      "data-ids",
      "ChIJeiffel,ChIJlouvre"
    );
  });

  it("omits places without coordinates or with the (0, 0) sentinel", () => {
    mockSearch({
      data: {
        places: [
          { placeId: "ChIJeiffel", name: "Tour Eiffel", latitude: 48.8584, longitude: 2.2945 },
          { placeId: "ChIJmissing", name: "No coords" },
          { placeId: "ChIJzero", name: "Unknown", latitude: 0, longitude: 0 },
        ],
      },
    });

    render(<ExploreResultsView />);

    expect(screen.getByTestId("poi-markers-layer")).toHaveAttribute("data-ids", "ChIJeiffel");
  });

  it("clears markers when the search errors", () => {
    mockSearch({
      isError: true,
      error: { error: { code: "GOOGLE_PLACE_SEARCH_ERROR" } },
      data: {
        places: [
          { placeId: "ChIJeiffel", name: "Tour Eiffel", latitude: 48.8584, longitude: 2.2945 },
        ],
      },
    });

    render(<ExploreResultsView />);

    expect(screen.getByTestId("poi-markers-layer")).toHaveAttribute("data-ids", "");
  });

  it("does not mount the markers layer on the idle state", () => {
    mockUseShell.mockReturnValue({ ...defaultShellState, query: "c" });
    mockSearch({
      data: {
        places: [
          { placeId: "ChIJeiffel", name: "Tour Eiffel", latitude: 48.8584, longitude: 2.2945 },
        ],
      },
    });

    render(<ExploreResultsView />);

    expect(screen.queryByTestId("poi-markers-layer")).not.toBeInTheDocument();
  });
});
