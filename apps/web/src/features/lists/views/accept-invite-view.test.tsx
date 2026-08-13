import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useJoinListByInvite } from "../hooks/use-join-list-by-invite";

import { AcceptInviteView } from "./accept-invite-view";

const push = vi.fn();
const mutate = vi.fn();
const useAuth = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock("@/features/auth", () => ({
  useAuth: () => useAuth(),
}));

vi.mock("../hooks/use-join-list-by-invite", () => ({
  useJoinListByInvite: vi.fn(),
}));

vi.mock("@/hooks/use-error-message", () => ({
  useErrorMessage: () => (error: unknown) => {
    if (
      typeof error === "object" &&
      error !== null &&
      "error" in error &&
      typeof error.error === "object" &&
      error.error !== null &&
      "code" in error.error
    ) {
      return String(error.error.code);
    }
    return "API error message";
  },
}));

const returnPath = "/list/list-1/collaborators/accept?token=invite-token";

function mockMutation(overrides: Partial<ReturnType<typeof useJoinListByInvite>> = {}) {
  vi.mocked(useJoinListByInvite).mockReturnValue({
    mutate,
    error: null,
    isPending: false,
    isError: false,
    ...overrides,
  } as ReturnType<typeof useJoinListByInvite>);
}

describe("AcceptInviteView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutate.mockReset();
    useAuth.mockReturnValue({
      user: { id: "user-1", email: "ada@example.com" },
      isLoading: false,
    });
    mockMutation();
  });

  it("shows COLLABORATOR_ALREADY_EXISTS and does not redirect", () => {
    const apiError = { success: false, error: { code: "COLLABORATOR_ALREADY_EXISTS" } };
    mockMutation({
      isError: true,
      error: apiError,
    });

    render(<AcceptInviteView listId="list-1" token="invite-token" returnPath={returnPath} />);

    expect(screen.getByRole("alert")).toHaveTextContent("COLLABORATOR_ALREADY_EXISTS");
    expect(push).not.toHaveBeenCalled();
  });

  it("joins once and navigates using the joined list id", () => {
    mutate.mockImplementation((_vars, options) => {
      options?.onSuccess?.({ list: { id: "joined-list" } });
    });

    render(<AcceptInviteView listId="url-list" token="invite-token" returnPath={returnPath} />);

    expect(mutate).toHaveBeenCalledWith(
      { listId: "url-list", token: "invite-token" },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    expect(push).toHaveBeenCalledWith("/?view=lists&listId=joined-list");
  });
});
