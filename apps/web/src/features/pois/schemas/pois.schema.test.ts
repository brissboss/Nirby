import { describe, expect, it } from "vitest";

import { poiConstraints } from "../constants/pois.constants";

import { createPoiFormSchema } from "./pois.schema";

const messages = {
  requiredName: "required",
  nameTooLong: "name too long",
  descriptionTooLong: "desc too long",
  addressTooLong: "address too long",
  latitudeInvalid: "lat invalid",
  longitudeInvalid: "lng invalid",
};

function schema() {
  return createPoiFormSchema(messages);
}

const validInput = {
  name: "Secret spot",
  latitude: 48.8566,
  longitude: 2.3522,
};

describe("createPoiFormSchema", () => {
  it("accepts valid required fields", () => {
    const result = schema().safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("trims whitespace from name", () => {
    const result = schema().safeParse({
      ...validInput,
      name: "  Secret spot  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Secret spot");
    }
  });

  it("accepts optional MVP fields", () => {
    const result = schema().safeParse({
      ...validInput,
      description: "A quiet corner",
      address: "1 rue de Rivoli",
      visibility: "PRIVATE",
      category: "park",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name with required message", () => {
    const result = schema().safeParse({
      ...validInput,
      name: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(messages.requiredName);
    }
  });

  it("rejects name longer than max", () => {
    const result = schema().safeParse({
      ...validInput,
      name: "a".repeat(poiConstraints.name.max + 1),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(messages.nameTooLong);
    }
  });

  it("rejects missing latitude with invalid message", () => {
    const result = schema().safeParse({
      name: validInput.name,
      longitude: validInput.longitude,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(messages.latitudeInvalid);
    }
  });

  it("rejects missing longitude with invalid message", () => {
    const result = schema().safeParse({
      name: validInput.name,
      latitude: validInput.latitude,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(messages.longitudeInvalid);
    }
  });

  it("rejects latitude below min", () => {
    const result = schema().safeParse({
      ...validInput,
      latitude: poiConstraints.latitude.min - 0.1,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(messages.latitudeInvalid);
    }
  });

  it("rejects latitude above max", () => {
    const result = schema().safeParse({
      ...validInput,
      latitude: poiConstraints.latitude.max + 0.1,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(messages.latitudeInvalid);
    }
  });

  it("rejects longitude below min", () => {
    const result = schema().safeParse({
      ...validInput,
      longitude: poiConstraints.longitude.min - 0.1,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(messages.longitudeInvalid);
    }
  });

  it("rejects longitude above max", () => {
    const result = schema().safeParse({
      ...validInput,
      longitude: poiConstraints.longitude.max + 0.1,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(messages.longitudeInvalid);
    }
  });

  it("rejects description longer than max", () => {
    const result = schema().safeParse({
      ...validInput,
      description: "a".repeat(poiConstraints.description.max + 1),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(messages.descriptionTooLong);
    }
  });

  it("rejects address longer than max", () => {
    const result = schema().safeParse({
      ...validInput,
      address: "a".repeat(poiConstraints.address.max + 1),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(messages.addressTooLong);
    }
  });

  it("rejects invalid visibility", () => {
    const result = schema().safeParse({
      ...validInput,
      visibility: "SECRET",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid category", () => {
    const result = schema().safeParse({
      ...validInput,
      category: "not-a-category",
    });
    expect(result.success).toBe(false);
  });
});
