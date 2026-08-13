import { describe, expect, it } from "vitest";

import { buildLoginHref, buildSignupHref, getSafeReturnPath } from "./auth-redirect";

describe("getSafeReturnPath", () => {
  it("accepts relative paths that start with a single slash", () => {
    expect(getSafeReturnPath("/")).toBe("/");
    expect(getSafeReturnPath("/list/abc/join?editToken=tok")).toBe("/list/abc/join?editToken=tok");
    expect(getSafeReturnPath("/list/abc/collaborators/accept?token=inv")).toBe(
      "/list/abc/collaborators/accept?token=inv"
    );
  });

  it("rejects protocol-relative, absolute, and encoded unsafe URLs", () => {
    expect(getSafeReturnPath("//evil.example")).toBeNull();
    expect(getSafeReturnPath("https://evil.example")).toBeNull();
    expect(getSafeReturnPath("http://evil.example/phish")).toBeNull();
    expect(getSafeReturnPath("/\\evil.example")).toBeNull();
    expect(getSafeReturnPath("/foo://bar")).toBeNull();
    expect(getSafeReturnPath("%2F%2Fevil.example")).toBeNull();
  });

  it("returns null for missing values", () => {
    expect(getSafeReturnPath(null)).toBeNull();
    expect(getSafeReturnPath(undefined)).toBeNull();
    expect(getSafeReturnPath("")).toBeNull();
    expect(getSafeReturnPath("list/abc")).toBeNull();
  });
});

describe("buildLoginHref / buildSignupHref", () => {
  it("appends a safe returnUrl", () => {
    expect(buildLoginHref("/list/1/join?editToken=abc")).toBe(
      "/login?returnUrl=%2Flist%2F1%2Fjoin%3FeditToken%3Dabc"
    );
    expect(buildSignupHref("/list/1/join?editToken=abc")).toBe(
      "/signup?returnUrl=%2Flist%2F1%2Fjoin%3FeditToken%3Dabc"
    );
  });

  it("falls back when the path is unsafe", () => {
    expect(buildLoginHref("//evil.example")).toBe("/login");
    expect(buildSignupHref("https://evil.example")).toBe("/signup");
  });
});
