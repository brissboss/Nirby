import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ListPoiRow } from "./list-poi-row";

import type { SavedPoiListItem } from "@/features/pois";

const useAuth = vi.fn();

vi.mock("@/features/auth/hooks", () => ({
  useAuth: () => useAuth(),
}));

vi.mock("@/features/pois/components/edit-poi-dialog", () => ({
  EditPoiDialog: ({ open, poi }: { open: boolean; poi: { id: string } }) =>
    open ? <div data-testid="edit-poi-dialog" data-poi-id={poi.id} /> : null,
}));

vi.mock("./remove-poi-dialog", () => ({
  RemovePoiDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="remove-poi-dialog" /> : null,
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
    category: "park",
    latitude: 48.87324153744834,
    longitude: 2.3412600502008014,
    createdBy: "user-1",
    photoUrls: [],
  },
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

describe("ListPoiRow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: { id: "user-1" } });
  });

  it("shows the edit button for a custom POI created by the user", async () => {
    const user = userEvent.setup();

    render(<ListPoiRow savedPoi={customSavedPoi} listId="list-1" canRemove />);

    const editButton = screen.getByRole("button", { name: "edit.action" });
    expect(editButton).toBeInTheDocument();

    await user.click(editButton);

    expect(screen.getByTestId("edit-poi-dialog")).toHaveAttribute("data-poi-id", "poi-1");
  });

  it("hides the edit button when the user did not create the POI", () => {
    useAuth.mockReturnValue({ user: { id: "user-2" } });

    render(<ListPoiRow savedPoi={customSavedPoi} listId="list-1" canRemove />);

    expect(screen.queryByRole("button", { name: "edit.action" })).not.toBeInTheDocument();
  });

  it("hides the edit button for a Google Place", () => {
    render(<ListPoiRow savedPoi={googleSavedPoi} listId="list-1" canRemove />);

    expect(screen.queryByRole("button", { name: "edit.action" })).not.toBeInTheDocument();
  });

  it("shows the remove button when canRemove is true", () => {
    render(<ListPoiRow savedPoi={customSavedPoi} listId="list-1" canRemove />);

    expect(screen.getByRole("button", { name: "removePoi.action" })).toBeInTheDocument();
  });

  it("hides the remove button when canRemove is false but still shows edit for the creator", () => {
    render(<ListPoiRow savedPoi={customSavedPoi} listId="list-1" canRemove={false} />);

    expect(screen.getByRole("button", { name: "edit.action" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "removePoi.action" })).not.toBeInTheDocument();
  });
});
