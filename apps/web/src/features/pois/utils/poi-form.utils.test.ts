import { describe, expect, it } from "vitest";

import { poiFormValuesToBody } from "./poi-form.utils";

describe("poiFormValuesToBody", () => {
  it("trims empty optional strings to undefined", () => {
    expect(
      poiFormValuesToBody({
        name: "Secret spot",
        latitude: 48.8566,
        longitude: 2.3522,
        description: "   ",
        address: "",
        visibility: "PRIVATE",
      })
    ).toEqual({
      name: "Secret spot",
      latitude: 48.8566,
      longitude: 2.3522,
      description: undefined,
      address: undefined,
      visibility: "PRIVATE",
      category: undefined,
    });
  });

  it("keeps optional fields when provided", () => {
    expect(
      poiFormValuesToBody({
        name: "Secret spot",
        latitude: 48.8566,
        longitude: 2.3522,
        description: "A quiet corner",
        address: "1 rue de Rivoli",
        visibility: "SHARED",
        category: "park",
      })
    ).toEqual({
      name: "Secret spot",
      latitude: 48.8566,
      longitude: 2.3522,
      description: "A quiet corner",
      address: "1 rue de Rivoli",
      visibility: "SHARED",
      category: "park",
    });
  });
});
