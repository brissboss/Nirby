import { describe, expect, it } from "vitest";

import { queryKeys } from "./query-keys";

describe("queryKeys.lists", () => {
  it("all is stable root", () => {
    expect(queryKeys.lists.all).toEqual(["lists"]);
  });

  it("list includes filters", () => {
    const filters = { page: 1, limit: 10 };
    expect(queryKeys.lists.list(filters)).toEqual(["lists", "list", filters]);
    expect(queryKeys.lists.list()).toEqual(["lists", "list", undefined]);
  });

  it("infinite includes filters", () => {
    const filters = { search: "paris", limit: 20 };
    expect(queryKeys.lists.infinite(filters)).toEqual(["lists", "infinite", filters]);
    expect(queryKeys.lists.infinite()).toEqual(["lists", "infinite", undefined]);
  });

  it("detail includes listId", () => {
    expect(queryKeys.lists.detail("abc")).toEqual(["lists", "detail", "abc"]);
  });

  it("keys are prefixed by all", () => {
    expect(queryKeys.lists.list()[0]).toBe(queryKeys.lists.all[0]);
    expect(queryKeys.lists.infinite()[0]).toBe(queryKeys.lists.all[0]);
    expect(queryKeys.lists.detail("id")[0]).toBe(queryKeys.lists.all[0]);
  });

  it("pois.all includes listId", () => {
    expect(queryKeys.lists.pois.all("list-1")).toEqual(["lists", "pois", "list-1"]);
  });

  it("pois.list includes listId and filters", () => {
    expect(queryKeys.lists.pois.list("list-1")).toEqual(["lists", "pois", "list-1", undefined]);

    expect(queryKeys.lists.pois.list("list-1", { page: 1 })).toEqual([
      "lists",
      "pois",
      "list-1",
      { page: 1 },
    ]);
  });

  it("pois.infinite includes listId and filters", () => {
    expect(queryKeys.lists.pois.infinite("list-1")).toEqual([
      "lists",
      "pois",
      "list-1",
      "infinite",
      undefined,
    ]);

    expect(queryKeys.lists.pois.infinite("list-1", { limit: 10 })).toEqual([
      "lists",
      "pois",
      "list-1",
      "infinite",
      { limit: 10 },
    ]);
  });

  it("poiMembership keys are prefixed by lists root", () => {
    expect(queryKeys.lists.poiMembership.all).toEqual(["lists", "poi-membership"]);
    expect(queryKeys.lists.poiMembership.byPlaces(["a", "b"])).toEqual([
      "lists",
      "poi-membership",
      ["a", "b"],
    ]);
    expect(queryKeys.lists.poiMembership.all[0]).toBe(queryKeys.lists.all[0]);
    expect(queryKeys.lists.poiMembership.byPlaces(["a"])[0]).toBe(queryKeys.lists.all[0]);
  });
});
