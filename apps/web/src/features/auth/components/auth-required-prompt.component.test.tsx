import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthRequiredPrompt } from "./auth-required-prompt.component";

describe("AuthRequiredPrompt", () => {
  it("links to login and signup without a return path", () => {
    render(<AuthRequiredPrompt />);

    expect(screen.getByRole("heading", { name: "title" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "login" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "signup" })).toHaveAttribute("href", "/signup");
  });

  it("keeps a safe returnPath on the login and signup links", () => {
    render(<AuthRequiredPrompt returnPath="/list/list-1/join?editToken=edit-token" />);

    expect(screen.getByRole("link", { name: "login" })).toHaveAttribute(
      "href",
      "/login?returnUrl=%2Flist%2Flist-1%2Fjoin%3FeditToken%3Dedit-token"
    );
    expect(screen.getByRole("link", { name: "signup" })).toHaveAttribute(
      "href",
      "/signup?returnUrl=%2Flist%2Flist-1%2Fjoin%3FeditToken%3Dedit-token"
    );
  });

  it("falls back to /login and /signup when returnPath is unsafe", () => {
    render(<AuthRequiredPrompt returnPath="https://evil.example" />);

    expect(screen.getByRole("link", { name: "login" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "signup" })).toHaveAttribute("href", "/signup");
  });
});
