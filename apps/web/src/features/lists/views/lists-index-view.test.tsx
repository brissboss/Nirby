import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useListsInfinite } from "../hooks/use-lists-infinite";

import { ListsIndexView } from "./lists-index-view";

import type { ListWithRole } from "@/lib/api";
import { expectNoAxeViolations } from "@/test/axe";

vi.mock("../hooks/use-lists-infinite", () => ({
  useListsInfinite: vi.fn(),
}));

vi.mock("../hooks/use-infinite-scroll", () => ({
  useInfiniteScroll: () => ({ current: null }),
}));

vi.mock("@/hooks/use-error-message", () => ({
  useErrorMessage: () => () => "API error message",
}));

const mockList: ListWithRole = {
  id: "list-1",
  name: "Paris spots",
  description: "My favorite places",
  visibility: "PRIVATE",
  role: "OWNER",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  createdBy: "user-1",
  imageUrl: null,
  shareToken: null,
  shareTokenExpiresAt: null,
  editToken: null,
  editTokenExpiresAt: null,
  poiCount: 3,
  collaboratorCount: 0,
};

const mockList2: ListWithRole = {
  ...mockList,
  id: "list-2",
  name: "Lyon food",
  description: "Restaurants",
};

function mockInfiniteQuery(overrides: Partial<ReturnType<typeof useListsInfinite>> = {}) {
  vi.mocked(useListsInfinite).mockReturnValue({
    data: {
      pages: [
        {
          lists: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        },
      ],
    },
    isPending: false,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useListsInfinite>);
}

describe("ListsIndexView", () => {
  const onCreate = vi.fn();
  const onSelectList = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading skeleton on initial load", () => {
    mockInfiniteQuery({
      data: undefined,
      isPending: true,
      isLoading: true,
    });

    render(<ListsIndexView onCreate={onCreate} onSelectList={onSelectList} />);

    expect(screen.getByLabelText("Loading lists")).toBeInTheDocument();
  });

  it("shows empty state when there are no lists", () => {
    mockInfiniteQuery();

    render(<ListsIndexView onCreate={onCreate} onSelectList={onSelectList} />);

    expect(screen.getByText("index.empty.title")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /index\.empty\.cta/i })).toBeInTheDocument();
  });

  it("calls onCreate from empty state CTA", async () => {
    const user = userEvent.setup();
    mockInfiniteQuery();

    render(<ListsIndexView onCreate={onCreate} onSelectList={onSelectList} />);

    await user.click(screen.getByRole("button", { name: /index\.empty\.cta/i }));

    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it("shows error state with retry", async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();
    mockInfiniteQuery({
      data: undefined,
      isError: true,
      error: new Error("fail"),
      refetch,
    });

    render(<ListsIndexView onCreate={onCreate} onSelectList={onSelectList} />);

    expect(screen.getByText("index.error.title")).toBeInTheDocument();
    expect(screen.getByText("API error message")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "index.error.retry" }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("renders list rows when data is available", () => {
    mockInfiniteQuery({
      data: {
        pageParams: [1],
        pages: [
          {
            lists: [mockList, mockList2],
            pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
          },
        ],
      },
    });

    render(<ListsIndexView onCreate={onCreate} onSelectList={onSelectList} />);

    expect(screen.getByText("Paris spots")).toBeInTheDocument();
    expect(screen.getByText("Lyon food")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /index\.create/i })).toBeInTheDocument();
  });

  it("calls onSelectList when a row is clicked", async () => {
    const user = userEvent.setup();
    mockInfiniteQuery({
      data: {
        pageParams: [1],
        pages: [
          {
            lists: [mockList],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
          },
        ],
      },
    });

    render(<ListsIndexView onCreate={onCreate} onSelectList={onSelectList} />);

    await user.click(screen.getByRole("button", { name: /Paris spots/i }));

    expect(onSelectList).toHaveBeenCalledWith("list-1");
  });
});

describe("ListsIndexView accessibility", () => {
  it("has no axe violations with lists loaded", async () => {
    mockInfiniteQuery({
      data: {
        pageParams: [1],
        pages: [
          {
            lists: [mockList, mockList2],
            pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
          },
        ],
      },
    });

    const { container } = render(<ListsIndexView onCreate={vi.fn()} onSelectList={vi.fn()} />);

    await expectNoAxeViolations(container);
  });
});
