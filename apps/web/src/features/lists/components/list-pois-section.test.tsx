import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useListPoisInfinite } from "../hooks/use-list-pois-infinite";

import { ListPoisSection } from "./list-pois-section";

import type { SavedPoiListItem } from "@/features/pois";

vi.mock("../hooks/use-list-pois-infinite", () => ({
  useListPoisInfinite: vi.fn(),
}));

vi.mock("../hooks/use-infinite-scroll", () => ({
  useInfiniteScroll: () => ({ current: null }),
}));

vi.mock("@/hooks/use-error-message", () => ({
  useErrorMessage: () => () => "API error message",
}));

vi.mock("../hooks/use-remove-poi-from-list", () => ({
  useRemovePoiFromList: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/features/pois/components/create-poi-dialog", () => ({
  CreatePoiDialog: ({ open, listId }: { open: boolean; listId?: string }) =>
    open ? <div data-testid="create-poi-dialog" data-list-id={listId} /> : null,
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

function mockListPoisInfiniteQuery(
  overrides: Partial<ReturnType<typeof useListPoisInfinite>> = {}
) {
  vi.mocked(useListPoisInfinite).mockReturnValue({
    data: {
      pages: [
        {
          savedPois: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        },
      ],
    },
    isPending: false,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useListPoisInfinite>);
}

describe("ListPoisSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows skeleton on initial load", () => {
    mockListPoisInfiniteQuery({
      data: undefined,
      isPending: true,
      isLoading: true,
    });

    render(<ListPoisSection listId="list-1" />);

    expect(screen.getByLabelText("Loading places")).toBeInTheDocument();
    expect(screen.queryByText("pois.empty.title")).not.toBeInTheDocument();
  });

  it("shows empty state when there are no saved POIs", () => {
    mockListPoisInfiniteQuery();

    render(<ListPoisSection listId="list-1" />);

    expect(screen.getByText("pois.section.title")).toBeInTheDocument();
    expect(screen.getByText("pois.section.total")).toBeInTheDocument();
    expect(screen.getByText("pois.empty.title")).toBeInTheDocument();
    expect(screen.getByText("pois.empty.description")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "create.title" })).not.toBeInTheDocument();
  });

  it("shows empty-state create CTA for EDITOR", async () => {
    const user = userEvent.setup();
    mockListPoisInfiniteQuery();

    render(<ListPoisSection listId="list-1" role="EDITOR" />);

    const createButton = screen.getByRole("button", { name: "create.title" });
    expect(createButton).toBeInTheDocument();

    await user.click(createButton);

    expect(screen.getByTestId("create-poi-dialog")).toHaveAttribute("data-list-id", "list-1");
  });

  it("hides create CTA for VIEWER", () => {
    mockListPoisInfiniteQuery();

    render(<ListPoisSection listId="list-1" role="VIEWER" />);

    expect(screen.queryByRole("button", { name: "create.title" })).not.toBeInTheDocument();
  });

  it("shows error state with retry", async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();

    mockListPoisInfiniteQuery({
      data: undefined,
      isError: true,
      error: new Error("fail"),
      refetch,
    });

    render(<ListPoisSection listId="list-1" />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("pois.error.title")).toBeInTheDocument();
    expect(screen.getByText("API error message")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "pois.error.retry" }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("renders custom POI and Google Place rows", () => {
    mockListPoisInfiniteQuery({
      data: {
        pageParams: [1],
        pages: [
          {
            savedPois: [customSavedPoi, googleSavedPoi],
            pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
          },
        ],
      },
    });

    render(<ListPoisSection listId="list-1" />);

    expect(screen.getByText("Fraktion")).toBeInTheDocument();
    expect(screen.getByText("Le Tout-Paris")).toBeInTheDocument();
    expect(screen.getByText("16 rue de la Grange Batelière, Paris")).toBeInTheDocument();
    expect(screen.getByText("8 Quai du Louvre, Paris")).toBeInTheDocument();
    expect(screen.getByText("pois.section.total")).toBeInTheDocument();
  });

  it("hides remove action for VIEWER", () => {
    mockListPoisInfiniteQuery({
      data: {
        pageParams: [1],
        pages: [
          {
            savedPois: [customSavedPoi, googleSavedPoi],
            pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
          },
        ],
      },
    });

    render(<ListPoisSection listId="list-1" role="VIEWER" />);

    expect(screen.queryByRole("button", { name: "removePoi.action" })).not.toBeInTheDocument();
  });

  it("shows remove action for EDITOR on each row", () => {
    mockListPoisInfiniteQuery({
      data: {
        pageParams: [1],
        pages: [
          {
            savedPois: [customSavedPoi, googleSavedPoi],
            pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
          },
        ],
      },
    });

    render(<ListPoisSection listId="list-1" role="EDITOR" />);

    expect(screen.getAllByRole("button", { name: "removePoi.action" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "create.title" })).toBeInTheDocument();
  });
});
