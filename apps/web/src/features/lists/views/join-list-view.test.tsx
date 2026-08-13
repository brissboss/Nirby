import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useJoinListByEditLink } from "../hooks/use-join-list-by-edit-link";

import { JoinListView } from "./join-list-view";

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

vi.mock("../hooks/use-join-list-by-edit-link", () => ({
  useJoinListByEditLink: vi.fn(),
}));

vi.mock("@/hooks/use-error-message", () => ({
  useErrorMessage: () => (error: unknown) =>
    error instanceof Error ? error.message : "API error message",
}));

const returnPath = "/list/url-list/join?editToken=edit-token";

function mockMutation(overrides: Partial<ReturnType<typeof useJoinListByEditLink>> = {}) {
  vi.mocked(useJoinListByEditLink).mockReturnValue({
    mutate,
    error: null,
    isPending: false,
    isError: false,
    ...overrides,
  } as ReturnType<typeof useJoinListByEditLink>);
}

describe("JoinListView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutate.mockReset();
    useAuth.mockReturnValue({
      user: { id: "user-1", email: "ada@example.com" },
      isLoading: false,
    });
    mockMutation();
  });

  it("links to login with returnUrl containing editToken when logged out", () => {
    useAuth.mockReturnValue({ user: null, isLoading: false });

    render(<JoinListView editToken="edit-token" returnPath={returnPath} />);

    expect(screen.getByRole("heading", { name: "join.edit.title" })).toBeInTheDocument();
    expect(screen.getByText("join.edit.description")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "login" })).toHaveAttribute(
      "href",
      "/login?returnUrl=%2Flist%2Furl-list%2Fjoin%3FeditToken%3Dedit-token"
    );
    expect(mutate).not.toHaveBeenCalled();
  });

  it("joins once and navigates to the lists detail using the joined list id", () => {
    mutate.mockImplementation((_vars, options) => {
      options?.onSuccess?.({ list: { id: "joined-list" } });
    });

    render(<JoinListView editToken="edit-token" returnPath={returnPath} />);

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate).toHaveBeenCalledWith(
      { editToken: "edit-token" },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    expect(push).toHaveBeenCalledWith("/?view=lists&listId=joined-list");
  });

  it("shows an API error and does not redirect when the token is invalid", () => {
    mockMutation({
      isError: true,
      error: new Error("LIST_NOT_FOUND"),
    });

    render(<JoinListView editToken="bad-token" returnPath={returnPath} />);

    expect(screen.getByRole("alert")).toHaveTextContent("LIST_NOT_FOUND");
    expect(push).not.toHaveBeenCalled();
  });

  it("shows missingToken and does not call the API when the token is absent", () => {
    render(<JoinListView editToken={null} returnPath="/list/url-list/join" />);

    expect(screen.getByRole("alert")).toHaveTextContent("join.missingToken");
    expect(mutate).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});
