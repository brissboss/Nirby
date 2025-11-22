import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../../src/auth/hash";

describe("hash", () => {
  it("should hash a password", async () => {
    const password = "test123";
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(20);
  });

  it("should verify a correct password", async () => {
    const password = "test123";
    const hash = await hashPassword(password);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it("should reject an incorrect password", async () => {
    const password = "test123";
    const hash = await hashPassword(password);

    const isValid = await verifyPassword("wrong", hash);
    expect(isValid).toBe(false);
  });

  it("should produce different hashes for the same password", async () => {
    const password = "test123";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2);
  });
});
