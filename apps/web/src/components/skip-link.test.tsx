import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SkipLink } from "./skip-link";

import { MAIN_CONTENT_ID } from "@/lib/a11y/landmarks";

describe("SkipLink", () => {
  it("points at the main landmark id", () => {
    render(<SkipLink>skipLink</SkipLink>);

    expect(screen.getByRole("link", { name: "skipLink" })).toHaveAttribute(
      "href",
      `#${MAIN_CONTENT_ID}`
    );
  });
});
