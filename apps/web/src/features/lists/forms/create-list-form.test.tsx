import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreateListForm } from "./create-list-form";

import { useCreateList } from "@/features/lists";

vi.mock("@/features/lists", () => ({
  DEFAULT_LIST_VISIBILITY: "PRIVATE",
  useCreateList: vi.fn(),
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

describe("CreateListForm", () => {
  const mutateAsync = vi.fn();
  const closeDialog = vi.fn();
  const onCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mutateAsync.mockResolvedValue({ list: { id: "list-1", name: "Paris" } });
    vi.mocked(useCreateList).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateList>);
  });

  it("submits a valid list and notifies success", async () => {
    const user = userEvent.setup();
    render(<CreateListForm closeDialog={closeDialog} onCreated={onCreated} />);

    await user.type(screen.getByLabelText("fields.name"), "Paris");
    await user.click(screen.getByRole("button", { name: "create.submit" }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        name: "Paris",
        description: undefined,
        visibility: "PRIVATE",
      });
      expect(toast.success).toHaveBeenCalledWith("createList.success");
      expect(closeDialog).toHaveBeenCalled();
      expect(onCreated).toHaveBeenCalledWith("list-1");
    });
  });

  it("shows an error toast when create fails", async () => {
    mutateAsync.mockRejectedValue({ error: { code: "FORBIDDEN" } });
    const user = userEvent.setup();
    render(<CreateListForm closeDialog={closeDialog} onCreated={onCreated} />);

    await user.type(screen.getByLabelText("fields.name"), "Paris");
    await user.click(screen.getByRole("button", { name: "create.submit" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("createList.error", {
        description: "API error message",
      });
    });
    expect(onCreated).not.toHaveBeenCalled();
  });
});
