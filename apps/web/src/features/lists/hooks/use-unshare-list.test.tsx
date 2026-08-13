import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUnshareList } from "./use-unshare-list";

import { unshareList } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

vi.mock("@/lib/api", () => ({
  unshareList: vi.fn(),
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function apiResponse(value: { data?: unknown; error?: unknown }) {
  return value as Awaited<ReturnType<typeof unshareList>>;
}

describe("useUnshareList", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  it("calls unshareList and returns data on success", async () => {
    const data = { message: "List unshared successfully" };
    vi.mocked(unshareList).mockResolvedValue(apiResponse({ data }));

    const { result } = renderHook(() => useUnshareList(), {
      wrapper: createWrapper(queryClient),
    });

    let resolved: unknown;
    await act(async () => {
      resolved = await result.current.mutateAsync({ listId: "list-1" });
    });

    expect(unshareList).toHaveBeenCalledWith({ path: { listId: "list-1" } });
    expect(resolved).toEqual(data);
  });

  it("invalidates list caches on success", async () => {
    vi.mocked(unshareList).mockResolvedValue(
      apiResponse({ data: { message: "List unshared successfully" } })
    );
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUnshareList(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ listId: "list-1" });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.lists.all });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.lists.detail("list-1") });
    });
  });

  it("throws API error when response has no data", async () => {
    const apiError = { message: "Forbidden" };
    vi.mocked(unshareList).mockResolvedValue(apiResponse({ error: apiError }));

    const { result } = renderHook(() => useUnshareList(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ listId: "list-1" });
      })
    ).rejects.toEqual(apiError);
  });
});
