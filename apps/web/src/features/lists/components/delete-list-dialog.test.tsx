import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDeleteList } from "../hooks/use-delete-list";

import { DeleteListDialog } from "./delete-list-dialog";

import { getErrorCode } from "@/lib/api/errors";

vi.mock("../hooks/use-delete-list", () => ({
  useDeleteList: vi.fn(),
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

describe("DeleteListDialog", () => {
  const mutateAsync = vi.fn();
  const onOpenChange = vi.fn();
  const onDeleted = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getErrorCode).mockReturnValue(null);
    mutateAsync.mockResolvedValue({ message: "List deleted successfully" });
    vi.mocked(useDeleteList).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteList>);
  });

  it("confirms deletion and shows a success toast", async () => {
    const user = userEvent.setup();

    render(
      <DeleteListDialog listId="list-1" open onOpenChange={onOpenChange} onDeleted={onDeleted} />
    );

    await user.click(screen.getByRole("button", { name: "delete.confirmSubmit" }));

    expect(mutateAsync).toHaveBeenCalledWith("list-1");
    expect(toast.success).toHaveBeenCalledWith("deleteList.success");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onDeleted).toHaveBeenCalledTimes(1);
  });

  it("closes without an error toast when the list is already gone", async () => {
    const user = userEvent.setup();
    vi.mocked(getErrorCode).mockReturnValue("LIST_NOT_FOUND");
    mutateAsync.mockRejectedValue({ error: { code: "LIST_NOT_FOUND" } });

    render(
      <DeleteListDialog listId="list-1" open onOpenChange={onOpenChange} onDeleted={onDeleted} />
    );

    await user.click(screen.getByRole("button", { name: "delete.confirmSubmit" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onDeleted).toHaveBeenCalledTimes(1);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("shows an error toast for other API failures", async () => {
    const user = userEvent.setup();
    mutateAsync.mockRejectedValue({ error: { code: "LIST_ACCESS_DENIED" } });

    render(
      <DeleteListDialog listId="list-1" open onOpenChange={onOpenChange} onDeleted={onDeleted} />
    );

    await user.click(screen.getByRole("button", { name: "delete.confirmSubmit" }));

    expect(toast.error).toHaveBeenCalledWith("deleteList.error", {
      description: "API error message",
    });
    expect(onDeleted).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
