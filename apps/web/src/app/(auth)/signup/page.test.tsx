import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SignupPage from "./page";

import { expectNoAxeViolations } from "@/test/axe";

const signup = vi.fn();
const resendEmail = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => searchParams,
}));

vi.mock("@/features/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/auth")>();
  return {
    ...actual,
    useAuth: () => ({ signup, resendEmail }),
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

describe("SignupPage", () => {
  beforeEach(() => {
    signup.mockReset();
    signup.mockResolvedValue(undefined);
    resendEmail.mockReset();
    resendEmail.mockResolvedValue(undefined);
    searchParams = new URLSearchParams();
  });

  async function submitValidSignup() {
    const user = userEvent.setup();
    await user.type(screen.getByRole("textbox"), "user@example.com");
    await user.type(screen.getByPlaceholderText("••••••••"), "password1");
    await user.click(screen.getByRole("button", { name: "auth.signup.signup" }));
    return user;
  }

  it("shows the email-sent state after a successful signup", async () => {
    render(<SignupPage />);

    await submitValidSignup();

    await waitFor(() => {
      expect(signup).toHaveBeenCalledWith("user@example.com", "password1");
      expect(screen.getByText("auth.signup.emailSentTitle")).toBeInTheDocument();
    });
  });

  it("resends the verification email from the success state", async () => {
    render(<SignupPage />);
    const user = await submitValidSignup();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "auth.verifyEmail.resendEmail" })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "auth.verifyEmail.resendEmail" }));

    await waitFor(() => {
      expect(resendEmail).toHaveBeenCalledWith("user@example.com");
      expect(toast.success).toHaveBeenCalledWith("auth.verifyEmail.emailResent");
    });
  });

  it("shows an error toast when signup fails", async () => {
    signup.mockRejectedValue({ error: { code: "EMAIL_ALREADY_EXISTS" } });
    render(<SignupPage />);

    await submitValidSignup();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("auth.signup.signupError", {
        description: "API error message",
      });
    });
  });

  it("keeps returnUrl on the login link", () => {
    searchParams = new URLSearchParams("returnUrl=/list/list-1/join?editToken=edit-token");
    render(<SignupPage />);

    expect(screen.getByRole("link", { name: "auth.signup.login" })).toHaveAttribute(
      "href",
      "/login?returnUrl=%2Flist%2Flist-1%2Fjoin%3FeditToken%3Dedit-token"
    );
  });

  it("has no axe violations", async () => {
    const { container } = render(<SignupPage />);

    await expectNoAxeViolations(container);
  });
});
