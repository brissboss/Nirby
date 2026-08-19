import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

import GlobalError from "./global-error";

function renderGlobalError(localeCookie: string) {
  document.cookie = `NEXT_LOCALE=${localeCookie}`;
  const error = Object.assign(new Error("boom"), { digest: "abc" });
  render(<GlobalError error={error} reset={vi.fn()} />);
}

describe("GlobalError", () => {
  it("renders French copy and lang by default", () => {
    renderGlobalError("fr");

    expect(document.documentElement).toHaveAttribute("lang", "fr");
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Une erreur est survenue");
    expect(
      screen.getByText("Une erreur inattendue s'est produite. Veuillez réessayer.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Réessayer" })).toBeInTheDocument();
  });

  it("renders English copy when NEXT_LOCALE is en", () => {
    renderGlobalError("en");

    expect(document.documentElement).toHaveAttribute("lang", "en");
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Something went wrong");
    expect(screen.getByText("An unexpected error occurred. Please try again.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
