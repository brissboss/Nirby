import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useRemovePoiFromList } from "../hooks/use-remove-poi-from-list";

import { RemovePoiDialog } from "./remove-poi-dialog";

import { getErrorCode } from "@/lib/api/errors";

vi.mock("../hooks/use-remove-poi-from-list", () => ({
  useRemovePoiFromList: vi.fn(),
}));

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
  },
}));

describe("RemovePoiDialog", () => {
  const mutateAsync = vi.fn();
  const onOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getErrorCode).mockReturnValue(null);
    mutateAsync.mockResolvedValue({ message: "POI removed from list successfully" });
    vi.mocked(useRemovePoiFromList).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useRemovePoiFromList>);
  });

  it("confirms removal and shows success toast", async () => {
    const user = userEvent.setup();

    render(
      <RemovePoiDialog
        listId="list-1"
        savedPoiId="sp-1"
        placeName="Fraktion"
        open
        onOpenChange={onOpenChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "removePoi.confirmSubmit" }));

    expect(mutateAsync).toHaveBeenCalledWith({ listId: "list-1", savedPoiId: "sp-1" });
    expect(toast.success).toHaveBeenCalledWith("removePoi.success");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes without error toast when saved POI is already gone", async () => {
    const user = userEvent.setup();
    vi.mocked(getErrorCode).mockReturnValue("SAVED_POI_NOT_FOUND");
    mutateAsync.mockRejectedValue({ error: { code: "SAVED_POI_NOT_FOUND" } });

    render(
      <RemovePoiDialog
        listId="list-1"
        savedPoiId="sp-1"
        placeName="Fraktion"
        open
        onOpenChange={onOpenChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "removePoi.confirmSubmit" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("shows error toast for other API failures", async () => {
    const user = userEvent.setup();
    mutateAsync.mockRejectedValue({ error: { code: "LIST_ACCESS_DENIED" } });

    render(
      <RemovePoiDialog
        listId="list-1"
        savedPoiId="sp-1"
        placeName="Fraktion"
        open
        onOpenChange={onOpenChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "removePoi.confirmSubmit" }));

    expect(toast.error).toHaveBeenCalledWith("removePoi.error", {
      description: "API error message",
    });
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
