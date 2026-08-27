import { describe, expect, it } from "vitest";

import { assertResetAllowed } from "../../prisma/seed-guard";

describe("assertResetAllowed", () => {
  it("allows development without a flag", () => {
    expect(() => assertResetAllowed("development", undefined)).not.toThrow();
  });

  it("allows production when ALLOW_DB_RESET=true", () => {
    expect(() => assertResetAllowed("production", "true")).not.toThrow();
  });

  it("blocks production without ALLOW_DB_RESET", () => {
    expect(() => assertResetAllowed("production", undefined)).toThrow(/ALLOW_DB_RESET/);
  });
});
