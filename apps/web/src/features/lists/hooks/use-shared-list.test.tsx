import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSharedList } from "./use-shared-list";

const getSharedList = vi.fn();

vi.mock("@/lib/api", () => ({
  getSharedList: (...args: unknown[]) => getSharedList(...args),
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useSharedList", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    getSharedList.mockResolvedValue({
      data: { list: { id: "list-1", name: "Paris spots" } },
    });
  });

  it("does not fetch when shareToken is undefined", () => {
    renderHook(() => useSharedList(undefined), {
      wrapper: createWrapper(queryClient),
    });

    expect(getSharedList).not.toHaveBeenCalled();
  });

  it("fetches a shared list without requiring a signed-in user", async () => {
    const { result } = renderHook(() => useSharedList("demo-share-token"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getSharedList).toHaveBeenCalledWith({ path: { shareToken: "demo-share-token" } });
    expect(result.current.data).toEqual({ list: { id: "list-1", name: "Paris spots" } });
  });

  it("throws API error when response has no data", async () => {
    const apiError = { success: false, error: { code: "LIST_NOT_FOUND" } };
    getSharedList.mockResolvedValue({ error: apiError });

    const { result } = renderHook(() => useSharedList("missing-token"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(apiError);
  });
});
