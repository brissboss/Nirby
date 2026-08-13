import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  SHARED_LIST_POIS_PAGE_SIZE,
  useSharedListPoisInfinite,
} from "./use-shared-list-pois-infinite";

const getSharedListPois = vi.fn();

vi.mock("@/lib/api", () => ({
  getSharedListPois: (...args: unknown[]) => getSharedListPois(...args),
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useSharedListPoisInfinite", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    getSharedListPois.mockResolvedValue({
      data: { pois: [{ id: "poi-1" }], pagination: { page: 1, totalPages: 1, total: 1 } },
    });
  });

  it("does not fetch when shareToken is undefined", () => {
    renderHook(() => useSharedListPoisInfinite(undefined), {
      wrapper: createWrapper(queryClient),
    });

    expect(getSharedListPois).not.toHaveBeenCalled();
  });

  it("fetches first page without requiring a signed-in user", async () => {
    const { result } = renderHook(() => useSharedListPoisInfinite("demo-share-token"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getSharedListPois).toHaveBeenCalledWith({
      path: { shareToken: "demo-share-token" },
      query: { page: 1, limit: SHARED_LIST_POIS_PAGE_SIZE },
    });
    expect(result.current.data?.pages[0]).toEqual({
      pois: [{ id: "poi-1" }],
      pagination: { page: 1, totalPages: 1, total: 1 },
    });
  });

  it("throws API error when response has no data", async () => {
    const apiError = { success: false, error: { code: "SHARE_TOKEN_EXPIRED" } };
    getSharedListPois.mockResolvedValue({ error: apiError });

    const { result } = renderHook(() => useSharedListPoisInfinite("expired-token"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(apiError);
  });
});
