import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSharedList } from "../hooks/use-shared-list";
import { useSharedListPoisInfinite } from "../hooks/use-shared-list-pois-infinite";

import { SharedListView } from "./shared-list-view";

import { getErrorCode } from "@/lib/api/errors";

vi.mock("../hooks/use-shared-list", () => ({
  useSharedList: vi.fn(),
}));

vi.mock("../hooks/use-shared-list-pois-infinite", () => ({
  useSharedListPoisInfinite: vi.fn(),
}));

vi.mock("../hooks/use-infinite-scroll", () => ({
  useInfiniteScroll: () => ({ current: null }),
}));

vi.mock("@/hooks/use-error-message", () => ({
  useErrorMessage: () => () => "API error message",
}));

vi.mock("@/lib/api/errors", () => ({
  getErrorCode: vi.fn(),
}));

const sharedList = {
  id: "list-1",
  name: "Paris spots",
  description: "My favorite places",
  creator: {
    name: "Ada",
    avatarUrl: null,
  },
};

function mockSharedListQuery(overrides: Partial<ReturnType<typeof useSharedList>> = {}) {
  vi.mocked(useSharedList).mockReturnValue({
    data: { list: sharedList },
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useSharedList>);
}

function mockSharedPoisQuery(
  overrides: Partial<ReturnType<typeof useSharedListPoisInfinite>> = {}
) {
  vi.mocked(useSharedListPoisInfinite).mockReturnValue({
    data: {
      pages: [
        {
          pois: [
            {
              id: "poi-1",
              name: "Fraktion",
              address: "16 rue de la Grange Batelière, Paris",
              category: "landmark",
            },
            {
              placeId: "ChIJxYJUC2lv5kcRlhdpWba_aGU",
              name: "Le Tout-Paris",
              address: "8 Quai du Louvre, Paris",
              categoryDisplayName: "French Restaurant",
            },
          ],
          pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
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
  } as ReturnType<typeof useSharedListPoisInfinite>);
}

describe("SharedListView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getErrorCode).mockReturnValue(null);
    mockSharedListQuery();
    mockSharedPoisQuery();
  });

  it("renders list name, creator, and POI cards", () => {
    render(<SharedListView shareToken="demo-share-token" />);

    expect(screen.getByRole("heading", { name: "Paris spots" })).toBeInTheDocument();
    expect(screen.getByText("My favorite places")).toBeInTheDocument();
    expect(screen.getByText("shared.creator.by")).toBeInTheDocument();
    expect(screen.getByText("Fraktion")).toBeInTheDocument();
    expect(screen.getByText("Le Tout-Paris")).toBeInTheDocument();
    expect(screen.queryByText("demo-share-token")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "removePoi.action" })).not.toBeInTheDocument();
  });

  it("shows not found for LIST_NOT_FOUND without retry", () => {
    vi.mocked(getErrorCode).mockReturnValue("LIST_NOT_FOUND");
    mockSharedListQuery({
      data: undefined,
      isError: true,
      error: new Error("LIST_NOT_FOUND"),
    });

    render(<SharedListView shareToken="missing-token" />);

    expect(screen.getByText("shared.notFound")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "shared.error.retry" })).not.toBeInTheDocument();
  });

  it("shows expired for SHARE_TOKEN_EXPIRED without retry", () => {
    vi.mocked(getErrorCode).mockReturnValue("SHARE_TOKEN_EXPIRED");
    mockSharedListQuery({
      data: undefined,
      isError: true,
      error: new Error("SHARE_TOKEN_EXPIRED"),
    });

    render(<SharedListView shareToken="expired-token" />);

    expect(screen.getByText("shared.expired")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "shared.error.retry" })).not.toBeInTheDocument();
  });

  it("shows retry for other API errors", async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();
    mockSharedListQuery({
      data: undefined,
      isError: true,
      error: new Error("fail"),
      refetch,
    });

    render(<SharedListView shareToken="demo-share-token" />);

    expect(screen.getByText("API error message")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "shared.error.retry" }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
