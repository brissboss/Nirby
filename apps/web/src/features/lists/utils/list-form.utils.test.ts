import { describe, expect, it } from "vitest";

import { listFormValuesToBody, listToFormValues } from "./list-form.utils";

describe("listToFormValues", () => {
  it("maps list fields to form defaults", () => {
    expect(
      listToFormValues({
        name: "Paris",
        description: null,
        visibility: "PUBLIC",
      })
    ).toEqual({
      name: "Paris",
      description: "",
      visibility: "PUBLIC",
    });
  });
});

describe("listFormValuesToBody", () => {
  it("trims empty description to undefined", () => {
    expect(
      listFormValuesToBody({
        name: "Paris",
        description: "   ",
        visibility: "PRIVATE",
      })
    ).toEqual({
      name: "Paris",
      description: undefined,
      visibility: "PRIVATE",
    });
  });
});
