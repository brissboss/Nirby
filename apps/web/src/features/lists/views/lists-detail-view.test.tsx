import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useList } from "../hooks/use-list";

import { ListsDetailView } from "./lists-detail-view";

import type { ListWithRole } from "@/lib/api";
import { getErrorCode } from "@/lib/api/errors";

vi.mock("../hooks/use-list", () => ({
  useList: vi.fn(),
}));

vi.mock("@/hooks/use-error-message", () => ({
  useErrorMessage: () => () => "API error message",
}));

vi.mock("@/lib/api/errors", () => ({
  getErrorCode: vi.fn(),
}));

const mockList: ListWithRole = {
  id: "list-1",
  name: "Paris spots",
  description: "My favorite places",
  visibility: "PRIVATE",
  role: "OWNER",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-06-01T00:00:00.000Z",
  createdBy: "user-1",
  imageUrl: null,
  shareToken: null,
  shareTokenExpiresAt: null,
  editToken: null,
  editTokenExpiresAt: null,
  poiCount: 3,
  collaboratorCount: 0,
};

function mockListQuery(overrides: Partial<ReturnType<typeof useList>> = {}) {
  vi.mocked(useList).mockReturnValue({
    data: { list: mockList },
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useList>);
}

describe("ListsDetailView", () => {
  const onBack = vi.fn();
  const onEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getErrorCode).mockReturnValue(null);
  });

  it("shows loading state", () => {
    mockListQuery({ data: undefined, isPending: true });

    render(<ListsDetailView listId="list-1" onBack={onBack} onEdit={onEdit} />);

    expect(screen.getByText("detail.loading")).toBeInTheDocument();
  });

  it("shows not found when API returns LIST_NOT_FOUND", () => {
    vi.mocked(getErrorCode).mockReturnValue("LIST_NOT_FOUND");
    mockListQuery({
      data: undefined,
      isError: true,
      error: new Error("LIST_NOT_FOUND"),
    });

    render(<ListsDetailView listId="list-1" onBack={onBack} onEdit={onEdit} />);

    expect(screen.getByText("detail.notFound")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "index.error.retry" })).not.toBeInTheDocument();
  });

  it("shows generic error with retry", async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();
    mockListQuery({
      data: undefined,
      isError: true,
      error: new Error("fail"),
      refetch,
    });

    render(<ListsDetailView listId="list-1" onBack={onBack} onEdit={onEdit} />);

    expect(screen.getByText("API error message")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "index.error.retry" }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("renders list content and POI placeholder for OWNER", () => {
    mockListQuery();

    render(<ListsDetailView listId="list-1" onBack={onBack} onEdit={onEdit} />);

    expect(screen.getByRole("heading", { name: "Paris spots" })).toBeInTheDocument();
    expect(screen.getByText("My favorite places")).toBeInTheDocument();
    expect(screen.getByText("role.OWNER")).toBeInTheDocument();
    expect(screen.getByText("detail.createdAt")).toBeInTheDocument();
    expect(screen.getByText("detail.poisComingSoon")).toBeInTheDocument();
  });

  it("shows edit button for OWNER and calls onEdit", async () => {
    const user = userEvent.setup();
    mockListQuery();

    render(<ListsDetailView listId="list-1" onBack={onBack} onEdit={onEdit} />);

    const editButton = screen.getByRole("button", { name: "edit.action" });
    expect(editButton).toBeInTheDocument();

    await user.click(editButton);

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("hides edit button for VIEWER", () => {
    mockListQuery({
      data: { list: { ...mockList, role: "VIEWER" } },
    });

    render(<ListsDetailView listId="list-1" onBack={onBack} onEdit={onEdit} />);

    expect(screen.queryByRole("button", { name: "edit.action" })).not.toBeInTheDocument();
    expect(screen.queryByText("edit.readOnly")).not.toBeInTheDocument();
  });
});
