import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient, getAccessToken, setAccessToken, setRefreshTokenFn } from "./client";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("apiClient interceptors", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    setAccessToken(null);
    setRefreshTokenFn(async () => null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setAccessToken(null);
    setRefreshTokenFn(async () => null);
  });

  it("sets the Authorization header when an access token is present", async () => {
    setAccessToken("access-token");
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    await apiClient.get({ url: "/list" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const request = fetchMock.mock.calls[0][0] as Request;
    expect(request.headers.get("Authorization")).toBe("Bearer access-token");
  });

  it("does not set Authorization when there is no access token", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    await apiClient.get({ url: "/list" });

    const request = fetchMock.mock.calls[0][0] as Request;
    expect(request.headers.get("Authorization")).toBeNull();
  });

  it("does not retry 401 responses on auth routes", async () => {
    setAccessToken("access-token");
    const refresh = vi.fn().mockResolvedValue("new-token");
    setRefreshTokenFn(refresh);
    fetchMock.mockResolvedValue(jsonResponse({ error: "unauthorized" }, 401));

    await apiClient.post({ url: "/auth/login", body: { email: "a@b.c", password: "x" } });

    expect(refresh).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries a 401 with the refreshed token on non-auth routes", async () => {
    setAccessToken("old-token");
    const refresh = vi.fn().mockResolvedValue("new-token");
    setRefreshTokenFn(refresh);
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: "unauthorized" }, 401))
      .mockResolvedValueOnce(jsonResponse({ lists: [] }, 200));

    const result = await apiClient.get({ url: "/list" });

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const retryRequest = fetchMock.mock.calls[1][0] as Request | string;
    const retryInit = fetchMock.mock.calls[1][1] as RequestInit | undefined;
    const retryHeaders =
      retryInit?.headers instanceof Headers
        ? retryInit.headers
        : retryRequest instanceof Request
          ? retryRequest.headers
          : new Headers(retryInit?.headers);
    expect(retryHeaders.get("Authorization")).toBe("Bearer new-token");
    expect(result.data).toEqual({ lists: [] });
  });

  it("clears the access token when refresh throws during a 401 retry", async () => {
    setAccessToken("old-token");
    setRefreshTokenFn(async () => {
      throw new Error("refresh failed");
    });
    fetchMock.mockResolvedValue(jsonResponse({ error: "unauthorized" }, 401));

    await apiClient.get({ url: "/list" });

    expect(getAccessToken()).toBeNull();
  });
});
