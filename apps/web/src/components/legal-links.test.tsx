import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LegalLinks } from "./legal-links";

describe("LegalLinks", () => {
  it("renders privacy and mentions links with the expected hrefs", () => {
    render(<LegalLinks />);

    expect(screen.getByRole("link", { name: "legal.privacy" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: "legal.mentions" })).toHaveAttribute(
      "href",
      "/mentions"
    );
  });

  it("renders stacked links with the same routes", () => {
    render(<LegalLinks variant="stack" />);

    expect(screen.getByRole("link", { name: "legal.privacy" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: "legal.mentions" })).toHaveAttribute(
      "href",
      "/mentions"
    );
  });
});
