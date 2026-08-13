import { describe, expect, it } from "vitest";

import {
  buildShellQuerySearchParams,
  buildShellViewSearchParams,
  parseShellQuery,
} from "./shell.constants";

describe("parseShellQuery", () => {
  it("defaults to an empty string and trims", () => {
    expect(parseShellQuery(null)).toBe("");
    expect(parseShellQuery("  café  ")).toBe("café");
  });
});

describe("buildShellQuerySearchParams", () => {
  it("keeps the current view when the query is below the min length", () => {
    const current = new URLSearchParams("view=lists&listId=abc");

    expect(buildShellQuerySearchParams(current, "c")).toBe("?view=lists&listId=abc&q=c");
  });

  it("removes q when the query is empty", () => {
    expect(buildShellQuerySearchParams(new URLSearchParams("q=café"), "")).toBe("");
  });

  it("switches to explore and clears the other params when the query reaches the min length", () => {
    const current = new URLSearchParams("view=lists&listId=abc&section=info&mapMode=1");

    expect(buildShellQuerySearchParams(current, "café")).toBe("?q=caf%C3%A9");
  });
});

describe("buildShellViewSearchParams", () => {
  it("preserves q when switching tabs", () => {
    const current = new URLSearchParams("q=tour+eiffel");

    expect(buildShellViewSearchParams(current, "lists")).toBe("?q=tour+eiffel&view=lists");
  });
});
