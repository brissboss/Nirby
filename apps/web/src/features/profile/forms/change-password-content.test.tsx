import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChangePasswordContent } from "./change-password-content";

const changePassword = vi.fn();

vi.mock("@/features/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/auth")>();
  return {
    ...actual,
    useAuth: () => ({ changePassword }),
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

function passwordInput(name: "oldPassword" | "newPassword") {
  const input = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
  if (!input) {
    throw new Error(`Missing ${name} input`);
  }
  return input;
}

describe("ChangePasswordContent", () => {
  const closeDialog = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    changePassword.mockResolvedValue(undefined);
  });

  it("rejects when the new password equals the old password", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordContent closeDialog={closeDialog} embedded />);

    await user.type(passwordInput("oldPassword"), "password1");
    await user.type(passwordInput("newPassword"), "password1");
    await user.click(screen.getByRole("button", { name: "changePassword.save" }));

    await waitFor(() => {
      expect(
        screen.getByText("errors.validation.formErrors.newPasswordSameAsOldPassword")
      ).toBeInTheDocument();
    });
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("changes the password and closes on success", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordContent closeDialog={closeDialog} embedded />);

    await user.type(passwordInput("oldPassword"), "oldpassword1");
    await user.type(passwordInput("newPassword"), "newpassword1");
    await user.click(screen.getByRole("button", { name: "changePassword.save" }));

    await waitFor(() => {
      expect(changePassword).toHaveBeenCalledWith("oldpassword1", "newpassword1");
      expect(toast.success).toHaveBeenCalledWith("changePassword.success");
      expect(closeDialog).toHaveBeenCalled();
    });
  });

  it("shows an error toast and stays open when change fails", async () => {
    changePassword.mockRejectedValue({ error: { code: "UNAUTHORIZED" } });
    const user = userEvent.setup();
    render(<ChangePasswordContent closeDialog={closeDialog} embedded />);

    await user.type(passwordInput("oldPassword"), "oldpassword1");
    await user.type(passwordInput("newPassword"), "newpassword1");
    await user.click(screen.getByRole("button", { name: "changePassword.save" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("changePassword.error", {
        description: "API error message",
      });
    });
    expect(closeDialog).not.toHaveBeenCalled();
  });
});
