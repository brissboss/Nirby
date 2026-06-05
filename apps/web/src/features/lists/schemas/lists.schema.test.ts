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

  it("trims whitespace from name", () => {
    const result = schema().safeParse({
      name: "  My list  ",
      visibility: "PRIVATE",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("My list");
    }
  });

  it("accepts input without description", () => {
    const result = schema().safeParse({
      name: "My list",
      visibility: "PRIVATE",
    });
    expect(result.success).toBe(true);
  });

  it("accepts SHARED and PUBLIC visibility", () => {
    for (const visibility of ["SHARED", "PUBLIC"] as const) {
      const result = schema().safeParse({
        name: "My list",
        visibility,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid visibility", () => {
    const result = schema().safeParse({
      name: "My list",
      visibility: "SECRET",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name with required message", () => {
    const result = schema().safeParse({
      name: "",
      visibility: "PRIVATE",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(messages.requiredName);
    }
  });

  it("rejects name longer than max", () => {
    const result = schema().safeParse({
      name: "a".repeat(listConstraints.name.max + 1),
      visibility: "PRIVATE",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(messages.nameTooLong);
    }
  });

  it("rejects description longer than max", () => {
    const result = schema().safeParse({
      name: "OK",
      description: "a".repeat(listConstraints.description.max + 1),
      visibility: "PRIVATE",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(messages.descriptionTooLong);
    }
  });
});

describe("createListFormSchema (edit flow)", () => {
  it("accepts a typical edit payload", () => {
    const result = schema().safeParse({
      name: "Updated list",
      description: "New description",
      visibility: "PUBLIC",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        name: "Updated list",
        description: "New description",
        visibility: "PUBLIC",
      });
    }
  });
});
