import { describe, it, expect } from "vitest";

import { listConstraints } from "../constants/lists.constants";

import { createListFormSchema } from "./lists.schema";

const messages = {
  requiredName: "required",
  nameTooLong: "too long",
  descriptionTooLong: "desc too long",
};

function schema() {
  return createListFormSchema(messages);
}

describe("createListFormSchema", () => {
  it("accepts valid input", () => {
    const result = schema().safeParse({
      name: "My list",
      description: "Optional",
      visibility: "PRIVATE",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = schema().safeParse({
      name: "",
      visibility: "PRIVATE",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name longer than max", () => {
    const result = schema().safeParse({
      name: "a".repeat(listConstraints.name.max + 1),
      visibility: "PRIVATE",
    });
    expect(result.success).toBe(false);
  });

  it("rejects description longer than max", () => {
    const result = schema().safeParse({
      name: "OK",
      description: "a".repeat(listConstraints.description.max + 1),
      visibility: "PRIVATE",
    });
    expect(result.success).toBe(false);
  });
});
