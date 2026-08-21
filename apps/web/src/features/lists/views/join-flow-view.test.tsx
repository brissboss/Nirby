import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { JoinFlowView } from "./join-flow-view";

vi.mock("@/hooks/use-error-message", () => ({
  useErrorMessage: () => () => "API error message",
}));

const baseProps = {
  mode: "edit" as const,
  returnPath: "/list/list-1/join?editToken=token",
  token: "edit-token",
  isAuthLoading: false,
  isAuthenticated: true,
  isJoining: false,
  error: null,
};

describe("JoinFlowView", () => {
  it("shows a loading spinner while auth is resolving", () => {
    render(<JoinFlowView {...baseProps} isAuthLoading />);

    expect(screen.getByLabelText("Loading")).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("shows AuthRequiredPrompt when the user is anonymous", () => {
    render(<JoinFlowView {...baseProps} isAuthenticated={false} token={null} />);

    expect(screen.getByRole("heading", { name: "join.edit.title" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "login" })).toHaveAttribute(
      "href",
      "/login?returnUrl=%2Flist%2Flist-1%2Fjoin%3FeditToken%3Dtoken"
    );
  });

  it("shows a missing-token alert when authenticated without a token", () => {
    render(<JoinFlowView {...baseProps} token={null} />);

    expect(screen.getByRole("alert")).toHaveTextContent("join.missingToken");
  });

  it("shows the error message when join fails", () => {
    render(<JoinFlowView {...baseProps} error={{ message: "boom" }} />);

    expect(screen.getByRole("alert")).toHaveTextContent("API error message");
  });

  it("shows the joining state when authenticated with a token and no error", () => {
    render(<JoinFlowView {...baseProps} isJoining />);

    expect(screen.getByLabelText("join.joining")).toBeInTheDocument();
    expect(screen.getByText("join.joining")).toBeInTheDocument();
  });
});
