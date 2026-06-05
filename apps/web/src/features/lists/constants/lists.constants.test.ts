import { describe, expect, it } from "vitest";

import { canDeleteList, canEditList } from "./lists.constants";

describe("canEditList", () => {
  it("allows OWNER, ADMIN, EDITOR", () => {
    expect(canEditList("OWNER")).toBe(true);
    expect(canEditList("ADMIN")).toBe(true);
    expect(canEditList("EDITOR")).toBe(true);
  });

  it("denies VIEWER and undefined", () => {
    expect(canEditList("VIEWER")).toBe(false);
    expect(canEditList(undefined)).toBe(false);
  });
});

describe("canDeleteList", () => {
  it("allows OWNER and ADMIN", () => {
    expect(canDeleteList("OWNER")).toBe(true);
    expect(canDeleteList("ADMIN")).toBe(true);
  });
  it("denies EDITOR, VIEWER and undefined", () => {
    expect(canDeleteList("EDITOR")).toBe(false);
    expect(canDeleteList("VIEWER")).toBe(false);
    expect(canDeleteList(undefined)).toBe(false);
  });
});
