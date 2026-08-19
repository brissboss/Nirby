import { describe, expect, it } from "vitest";

import { getLocaleFromCookieString } from "./locale-from-cookie";

describe("getLocaleFromCookieString", () => {
  it("falls back to French when the cookie is missing or invalid", () => {
    expect(getLocaleFromCookieString("")).toBe("fr");
    expect(getLocaleFromCookieString("theme=dark")).toBe("fr");
    expect(getLocaleFromCookieString("NEXT_LOCALE=de")).toBe("fr");
  });

  it("reads NEXT_LOCALE among other cookies", () => {
    expect(getLocaleFromCookieString("theme=dark; NEXT_LOCALE=en; other=1")).toBe("en");
    expect(getLocaleFromCookieString("NEXT_LOCALE=fr")).toBe("fr");
  });
});
