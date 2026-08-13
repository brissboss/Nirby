import { describe, expect, it } from "vitest";

import { buildEditLinkUrl, buildShareUrl } from "./share-links.utils";

describe("buildShareUrl", () => {
  it("builds the public shared list path", () => {
    expect(buildShareUrl("https://nirby.app", "abc123")).toBe("https://nirby.app/shared/abc123");
  });
});

describe("buildEditLinkUrl", () => {
  it("builds the join path with editToken query", () => {
    expect(buildEditLinkUrl("https://nirby.app", "list-1", "tok-9")).toBe(
      "https://nirby.app/list/list-1/join?editToken=tok-9"
    );
  });
});
