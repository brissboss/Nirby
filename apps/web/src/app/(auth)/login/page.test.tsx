import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LoginPage from "./page";

const push = vi.fn();
const login = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
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
    useAuth: () => ({ login }),
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

describe("LoginPage returnUrl", () => {
  beforeEach(() => {
    push.mockClear();
    login.mockReset();
    login.mockResolvedValue(undefined);
    searchParams = new URLSearchParams();
  });

  async function submitValidCredentials() {
    const user = userEvent.setup();
    await user.type(screen.getByRole("textbox"), "user@example.com");
    await user.type(screen.getByPlaceholderText("••••••••"), "password1");
    await user.click(screen.getByRole("button", { name: "auth.login.login" }));
  }

  it("redirects to a safe returnUrl after login", async () => {
    searchParams = new URLSearchParams("returnUrl=/list/list-1/join?editToken=edit-token");
    render(<LoginPage />);

    await submitValidCredentials();

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith("user@example.com", "password1");
      expect(push).toHaveBeenCalledWith("/list/list-1/join?editToken=edit-token");
    });
  });

  it("redirects to / when returnUrl is missing", async () => {
    render(<LoginPage />);

    await submitValidCredentials();

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/");
    });
  });

  it("redirects to / when returnUrl is unsafe", async () => {
    searchParams = new URLSearchParams("returnUrl=https://evil.example");
    render(<LoginPage />);

    await submitValidCredentials();

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/");
    });
  });

  it("keeps returnUrl on the signup link", () => {
    searchParams = new URLSearchParams("returnUrl=/list/list-1/join?editToken=edit-token");
    render(<LoginPage />);

    expect(screen.getByRole("link", { name: "auth.login.signup" })).toHaveAttribute(
      "href",
      "/signup?returnUrl=%2Flist%2Flist-1%2Fjoin%3FeditToken%3Dedit-token"
    );
  });
});
