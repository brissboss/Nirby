import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DeleteAccountContent } from "./delete-account-content";

const deleteAccount = vi.fn();

vi.mock("@/features/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/auth")>();
  return {
    ...actual,
    useAuth: () => ({ deleteAccount }),
  };
});

vi.mock("@/hooks/use-error-message", () => ({
  useErrorMessage: () => () => "API error message",
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("DeleteAccountContent", () => {
  const closeDialog = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    deleteAccount.mockResolvedValue(undefined);
  });

  it("requires a password before submitting", async () => {
    const user = userEvent.setup();
    render(<DeleteAccountContent closeDialog={closeDialog} embedded />);

    await user.click(screen.getByRole("button", { name: "deleteAccount.delete" }));

    expect(deleteAccount).not.toHaveBeenCalled();
    expect(closeDialog).not.toHaveBeenCalled();
  });

  it("deletes the account and closes on success", async () => {
    const user = userEvent.setup();
    render(<DeleteAccountContent closeDialog={closeDialog} embedded />);

    await user.type(screen.getByLabelText("common.labels.password"), "password1");
    await user.click(screen.getByRole("button", { name: "deleteAccount.delete" }));

    await waitFor(() => {
      expect(deleteAccount).toHaveBeenCalledWith("password1");
      expect(toast.success).toHaveBeenCalledWith("deleteAccount.success");
      expect(closeDialog).toHaveBeenCalled();
    });
  });

  it("shows an error toast and stays open when delete fails", async () => {
    deleteAccount.mockRejectedValue({ error: { code: "UNAUTHORIZED" } });
    const user = userEvent.setup();
    render(<DeleteAccountContent closeDialog={closeDialog} embedded />);

    await user.type(screen.getByLabelText("common.labels.password"), "password1");
    await user.click(screen.getByRole("button", { name: "deleteAccount.delete" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("deleteAccount.error", {
        description: "API error message",
      });
    });
    expect(closeDialog).not.toHaveBeenCalled();
  });
});
