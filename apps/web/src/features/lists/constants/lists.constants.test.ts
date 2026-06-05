import { describe, expect, it } from "vitest";

import {
  buildListsNavigationSearchParams,
  canDeleteList,
  canEditList,
  parseListId,
} from "./lists.constants";

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

describe("parseListId", () => {
  it("returns null when param is absent or empty", () => {
    expect(parseListId(null)).toBe(null);
    expect(parseListId("")).toBe(null);
  });
  it("returns the raw id", () => {
    expect(parseListId("abc-123")).toBe("abc-123");
  });
});
describe("buildListsNavigationSearchParams", () => {
  it("builds index URL without listId", () => {
    const qs = buildListsNavigationSearchParams(new URLSearchParams(), null);
    expect(qs).toBe("?view=lists");
  });
  it("builds detail URL with listId", () => {
    const qs = buildListsNavigationSearchParams(new URLSearchParams(), "abc-123");
    expect(qs).toBe("?view=lists&listId=abc-123");
  });
  it("removes mapMode and replaces listId when going back to index", () => {
    const current = new URLSearchParams("view=lists&listId=abc&mapMode=1");
    const qs = buildListsNavigationSearchParams(current, null);
    expect(qs).toBe("?view=lists");
  });
});
