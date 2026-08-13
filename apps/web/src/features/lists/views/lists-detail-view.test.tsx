import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDeleteList } from "../hooks/use-delete-list";
import { useList } from "../hooks/use-list";

import { ListsDetailView } from "./lists-detail-view";

import type { MapPoi } from "@/features/pois";
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

vi.mock("../hooks/use-delete-list", () => ({
  useDeleteList: vi.fn(),
}));

const useListMapPois = vi.fn((): MapPoi[] => []);

vi.mock("../hooks/use-list-map-pois", () => ({
  useListMapPois: () => useListMapPois(),
}));

vi.mock("@/features/map", () => ({
  PoiMarkersLayer: ({ pois }: { pois: { id: string }[] }) => (
    <div data-testid="poi-markers-layer" data-ids={pois.map((poi) => poi.id).join(",")} />
  ),
}));

vi.mock("../components/list-pois-section", () => ({
  ListPoisSection: ({ listId, role }: { listId: string; role?: string }) => (
    <div data-testid="list-pois-section" data-list-id={listId} data-role={role ?? ""} />
  ),
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
  const onDelete = vi.fn();
  const mutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useListMapPois.mockReturnValue([]);
    vi.mocked(getErrorCode).mockReturnValue(null);
    mutateAsync.mockResolvedValue({ message: "List deleted successfully" });
    vi.mocked(useDeleteList).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteList>);
  });

  it("shows loading state", () => {
    mockListQuery({ data: undefined, isPending: true });

    render(<ListsDetailView listId="list-1" onBack={onBack} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByText("detail.loading")).toBeInTheDocument();
  });

  it("shows not found when API returns LIST_NOT_FOUND", () => {
    vi.mocked(getErrorCode).mockReturnValue("LIST_NOT_FOUND");
    mockListQuery({
      data: undefined,
      isError: true,
      error: new Error("LIST_NOT_FOUND"),
    });

    render(<ListsDetailView listId="list-1" onBack={onBack} onEdit={onEdit} onDelete={onDelete} />);

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

    render(<ListsDetailView listId="list-1" onBack={onBack} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByText("API error message")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "index.error.retry" }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("renders list content and ListPoisSection for OWNER", () => {
    mockListQuery();

    render(<ListsDetailView listId="list-1" onBack={onBack} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByRole("heading", { name: "Paris spots" })).toBeInTheDocument();
    expect(screen.getByText("My favorite places")).toBeInTheDocument();
    expect(screen.getByText("role.OWNER")).toBeInTheDocument();
    expect(screen.getByText("detail.createdAt")).toBeInTheDocument();

    const poisSection = screen.getByTestId("list-pois-section");
    expect(poisSection).toBeInTheDocument();
    expect(poisSection).toHaveAttribute("data-list-id", "list-1");
    expect(poisSection).toHaveAttribute("data-role", "OWNER");
  });

  it("shows edit button for OWNER and calls onEdit", async () => {
    const user = userEvent.setup();
    mockListQuery();

    render(<ListsDetailView listId="list-1" onBack={onBack} onEdit={onEdit} onDelete={onDelete} />);

    const editButton = screen.getByRole("button", { name: "edit.action" });
    expect(editButton).toBeInTheDocument();

    await user.click(editButton);

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("hides edit button for VIEWER", () => {
    mockListQuery({
      data: { list: { ...mockList, role: "VIEWER" } },
    });

    render(<ListsDetailView listId="list-1" onBack={onBack} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.queryByRole("button", { name: "edit.action" })).not.toBeInTheDocument();
    expect(screen.queryByText("edit.readOnly")).not.toBeInTheDocument();
  });

  it("hides delete button for VIEWER", () => {
    mockListQuery({
      data: { list: { ...mockList, role: "VIEWER" } },
    });

    render(<ListsDetailView listId="list-1" onBack={onBack} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.queryByRole("button", { name: "delete.submit" })).not.toBeInTheDocument();
  });

  it("hides delete button for EDITOR", () => {
    mockListQuery({
      data: { list: { ...mockList, role: "EDITOR" } },
    });

    render(<ListsDetailView listId="list-1" onBack={onBack} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByRole("button", { name: "edit.action" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "delete.submit" })).not.toBeInTheDocument();
  });

  it("shows delete button for OWNER", () => {
    mockListQuery();

    render(<ListsDetailView listId="list-1" onBack={onBack} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByRole("button", { name: "delete.submit" })).toBeInTheDocument();
  });

  it("confirms deletion and calls onDelete", async () => {
    const user = userEvent.setup();
    mockListQuery();

    render(<ListsDetailView listId="list-1" onBack={onBack} onEdit={onEdit} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "delete.submit" }));
    await user.click(screen.getByRole("button", { name: "delete.confirmSubmit" }));

    expect(mutateAsync).toHaveBeenCalledWith("list-1");
    expect(toast.success).toHaveBeenCalledWith("deleteList.success");
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("passes geolocated list POIs to the markers layer", () => {
    mockListQuery();
    useListMapPois.mockReturnValue([
      { id: "sp-1", lat: 48.8732, lng: 2.3413, label: "Fraktion" },
      { id: "sp-2", lat: 48.8587, lng: 2.3423, label: "Le Tout-Paris" },
    ]);

    render(<ListsDetailView listId="list-1" onBack={onBack} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByTestId("poi-markers-layer")).toHaveAttribute("data-ids", "sp-1,sp-2");
  });

  it("renders an empty markers layer when the list has no geo POIs", () => {
    mockListQuery();
    useListMapPois.mockReturnValue([]);

    render(<ListsDetailView listId="list-1" onBack={onBack} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByTestId("poi-markers-layer")).toHaveAttribute("data-ids", "");
  });
});
