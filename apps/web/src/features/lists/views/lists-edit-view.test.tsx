import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useList } from "../hooks/use-list";
import { useUpdateList } from "../hooks/use-update-list";

import { ListsEditView } from "./lists-edit-view";

import type { ListWithRole } from "@/lib/api";

vi.mock("../hooks/use-list", () => ({
  useList: vi.fn(),
}));

vi.mock("../hooks/use-update-list", () => ({
  useUpdateList: vi.fn(),
}));

vi.mock("@/hooks/use-error-message", () => ({
  useErrorMessage: () => () => "API error message",
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
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

describe("ListsEditView", () => {
  const onBack = vi.fn();
  const mutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mutateAsync.mockResolvedValue({ list: mockList });
    vi.mocked(useUpdateList).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateList>);
  });

  it("shows loading state", () => {
    mockListQuery({ data: undefined, isPending: true });

    render(<ListsEditView listId="list-1" onBack={onBack} />);

    expect(screen.getByText("detail.loading")).toBeInTheDocument();
  });

  it("shows read-only message for VIEWER", () => {
    mockListQuery({
      data: { list: { ...mockList, role: "VIEWER" } },
    });

    render(<ListsEditView listId="list-1" onBack={onBack} />);

    expect(screen.getByText("edit.readOnly")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "edit.submit" })).not.toBeInTheDocument();
  });

  it("renders edit form for OWNER", () => {
    mockListQuery();

    render(<ListsEditView listId="list-1" onBack={onBack} />);

    expect(screen.getByRole("heading", { name: "edit.title" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Paris spots")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "edit.submit" })).toBeInTheDocument();
  });

  it("submits update and returns to detail via onBack", async () => {
    const user = userEvent.setup();
    mockListQuery();

    render(<ListsEditView listId="list-1" onBack={onBack} />);

    const nameInput = screen.getByDisplayValue("Paris spots");
    await user.clear(nameInput);
    await user.type(nameInput, "Updated name");

    await user.click(screen.getByRole("button", { name: "edit.submit" }));

    expect(mutateAsync).toHaveBeenCalledWith({
      listId: "list-1",
      body: {
        name: "Updated name",
        description: "My favorite places",
        visibility: "PRIVATE",
      },
    });
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
