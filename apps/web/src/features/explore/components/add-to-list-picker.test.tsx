import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AddToListPicker } from "./add-to-list-picker";

import { useAddPoiToList, useLists } from "@/features/lists";
import { getErrorCode } from "@/lib/api/errors";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/features/lists", async () => {
  const actual = await vi.importActual<typeof import("@/features/lists")>("@/features/lists");
  return {
    ...actual,
    useLists: vi.fn(),
    useAddPoiToList: vi.fn(),
  };
});

vi.mock("@/hooks/use-error-message", () => ({
  useErrorMessage: () => () => "API error message",
}));

vi.mock("@/lib/api/errors", () => ({
  getErrorCode: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("AddToListPicker", () => {
  const mutateAsync = vi.fn();
  const onOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getErrorCode).mockReturnValue(null);
    mutateAsync.mockResolvedValue({ message: "ok" });
    vi.mocked(useAddPoiToList).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useAddPoiToList>);
    vi.mocked(useLists).mockReturnValue({
      data: {
        lists: [
          { id: "list-1", name: "Paris", visibility: "PRIVATE", role: "OWNER" },
          { id: "list-2", name: "Shared", visibility: "SHARED", role: "VIEWER" },
        ],
        pagination: { page: 1, limit: 100, total: 2, totalPages: 1 },
      },
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useLists>);
  });

  it("only shows editable lists", () => {
    render(
      <AddToListPicker
        googlePlaceId="gp-1"
        placeName="Tour Eiffel"
        savedListIds={[]}
        open
        onOpenChange={onOpenChange}
      />
    );

    expect(screen.getByRole("button", { name: /Paris/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Shared/ })).not.toBeInTheDocument();
  });

  it("shows an already-added badge on lists that contain the place", () => {
    render(
      <AddToListPicker
        googlePlaceId="gp-1"
        placeName="Tour Eiffel"
        savedListIds={["list-1"]}
        open
        onOpenChange={onOpenChange}
      />
    );

    expect(screen.getByText("addToList.picker.alreadyInList")).toBeInTheDocument();
  });

  it("adds the place to the selected list", async () => {
    const user = userEvent.setup();

    render(
      <AddToListPicker
        googlePlaceId="gp-1"
        placeName="Tour Eiffel"
        savedListIds={[]}
        open
        onOpenChange={onOpenChange}
      />
    );

    await user.click(screen.getByRole("button", { name: /Paris/ }));
    await user.click(screen.getByRole("button", { name: "addToList.picker.submit" }));

    expect(mutateAsync).toHaveBeenCalledWith({
      listId: "list-1",
      body: { googlePlaceId: "gp-1" },
    });
    expect(toast.success).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows info toast when place is already saved", async () => {
    const user = userEvent.setup();
    vi.mocked(getErrorCode).mockReturnValue("POI_ALREADY_SAVED");
    mutateAsync.mockRejectedValue({ error: { code: "POI_ALREADY_SAVED" } });

    render(
      <AddToListPicker
        googlePlaceId="gp-1"
        placeName="Tour Eiffel"
        savedListIds={[]}
        open
        onOpenChange={onOpenChange}
      />
    );

    await user.click(screen.getByRole("button", { name: /Paris/ }));
    await user.click(screen.getByRole("button", { name: "addToList.picker.submit" }));

    expect(toast.info).toHaveBeenCalledWith("addToList.alreadySaved");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows error toast for other failures", async () => {
    const user = userEvent.setup();
    mutateAsync.mockRejectedValue({ error: { code: "LIST_ACCESS_DENIED" } });

    render(
      <AddToListPicker
        googlePlaceId="gp-1"
        placeName="Tour Eiffel"
        savedListIds={[]}
        open
        onOpenChange={onOpenChange}
      />
    );

    await user.click(screen.getByRole("button", { name: /Paris/ }));
    await user.click(screen.getByRole("button", { name: "addToList.picker.submit" }));

    expect(toast.error).toHaveBeenCalledWith("addToList.error", {
      description: "API error message",
    });
  });
});
