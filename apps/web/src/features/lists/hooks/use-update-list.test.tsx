import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUpdateList } from "./use-update-list";

import { updateList } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

vi.mock("@/lib/api", () => ({
  updateList: vi.fn(),
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function apiResponse(value: { data?: unknown; error?: unknown }) {
  return value as Awaited<ReturnType<typeof updateList>>;
}

describe("useUpdateList", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  it("calls updateList and returns data on success", async () => {
    const body = { name: "Paris", visibility: "PRIVATE" as const };
    const data = { list: { id: "list-1", name: "Paris" } };
    vi.mocked(updateList).mockResolvedValue(apiResponse({ data }));

    const { result } = renderHook(() => useUpdateList(), {
      wrapper: createWrapper(queryClient),
    });

    let resolved: unknown;
    await act(async () => {
      resolved = await result.current.mutateAsync({ listId: "list-1", body });
    });

    expect(updateList).toHaveBeenCalledWith({ path: { listId: "list-1" }, body });
    expect(resolved).toEqual(data);
  });

  it("invalidates list index and detail caches on success", async () => {
    vi.mocked(updateList).mockResolvedValue(
      apiResponse({ data: { list: { id: "list-1", name: "Paris" } } })
    );
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateList(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        listId: "list-1",
        body: { name: "Paris", visibility: "PRIVATE" },
      });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.lists.all });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.lists.detail("list-1") });
    });
  });

  it("throws API error when response has no data", async () => {
    const apiError = { message: "Forbidden" };
    vi.mocked(updateList).mockResolvedValue(apiResponse({ error: apiError }));

    const { result } = renderHook(() => useUpdateList(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          listId: "list-1",
          body: { name: "Paris", visibility: "PRIVATE" },
        });
      })
    ).rejects.toEqual(apiError);
  });
});
