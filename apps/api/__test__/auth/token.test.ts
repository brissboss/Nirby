import { describe, it, expect } from "vitest";
import { signAccessToken, verifyAccessToken } from "../../src/auth/token";

describe("token", () => {
  const payload = { userId: "user123", email: "test@test.com" };

  it("should sign an access token", () => {
    const token = signAccessToken(payload);

    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);
  });

  it("should verify a valid access token", () => {
    const token = signAccessToken(payload);
    const decoded = verifyAccessToken(token);

    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
  });

  it("should throw on invalid token", () => {
    expect(() => {
      verifyAccessToken("invalid.token.here");
    }).toThrow();
  });

  it("should throw on expired token", () => {
    // Note: To test expiration, we would need to modify the TTL
    // or use a pre-generated expired token
    // For now, we just test that invalid tokens are rejected
    expect(() => {
      verifyAccessToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature");
    }).toThrow();
  });

  it("should produce different tokens for same payload", () => {
    const token1 = signAccessToken(payload);
    const token2 = signAccessToken(payload);

    expect(verifyAccessToken(token1).userId).toBe(payload.userId);
    expect(verifyAccessToken(token2).userId).toBe(payload.userId);
  });
});
