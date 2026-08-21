import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ForgotPasswordPage from "./page";

import { expectNoAxeViolations } from "@/test/axe";

const back = vi.fn();
const forgotPassword = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back,
  }),
}));

vi.mock("@/features/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/auth")>();
  return {
    ...actual,
    useAuth: () => ({ forgotPassword }),
  };
});

vi.mock("@/hooks/use-error-message", () => ({
  useErrorMessage: () => () => "API error message",
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    back.mockClear();
    forgotPassword.mockReset();
    forgotPassword.mockResolvedValue(undefined);
  });

  it("shows the email-sent state after a successful request", async () => {
    render(<ForgotPasswordPage />);
    const user = userEvent.setup();

    await user.type(screen.getByRole("textbox"), "user@example.com");
    await user.click(screen.getByRole("button", { name: "common.buttons.send" }));

    await waitFor(() => {
      expect(forgotPassword).toHaveBeenCalledWith("user@example.com");
      expect(screen.getByText("auth.forgotPassword.emailSentTitle")).toBeInTheDocument();
    });
  });

  it("shows an error toast when the request fails", async () => {
    forgotPassword.mockRejectedValue({ error: { code: "NOT_FOUND" } });
    render(<ForgotPasswordPage />);
    const user = userEvent.setup();

    await user.type(screen.getByRole("textbox"), "user@example.com");
    await user.click(screen.getByRole("button", { name: "common.buttons.send" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("auth.forgotPassword.forgotPasswordError", {
        description: "API error message",
      });
    });
  });

  it("goes back when the back button is clicked", async () => {
    render(<ForgotPasswordPage />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "common.buttons.back" }));

    expect(back).toHaveBeenCalled();
  });

  it("has no axe violations", async () => {
    const { container } = render(<ForgotPasswordPage />);

    await expectNoAxeViolations(container);
  });
});
