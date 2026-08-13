import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useRemovePoiFromList } from "./use-remove-poi-from-list";

import { removePoiFromList } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

vi.mock("@/lib/api", () => ({
  removePoiFromList: vi.fn(),
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function apiResponse(value: { data?: unknown; error?: unknown }) {
  return value as Awaited<ReturnType<typeof removePoiFromList>>;
}

describe("useRemovePoiFromList", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  it("calls removePoiFromList and returns data on success", async () => {
    const input = { listId: "list-1", savedPoiId: "saved-1" };
    const data = { message: "POI removed" };
    vi.mocked(removePoiFromList).mockResolvedValue(apiResponse({ data }));

    const { result } = renderHook(() => useRemovePoiFromList(), {
      wrapper: createWrapper(queryClient),
    });

    let resolved: unknown;
    await act(async () => {
      resolved = await result.current.mutateAsync(input);
    });

    expect(removePoiFromList).toHaveBeenCalledWith({
      path: { listId: "list-1", savedPoiId: "saved-1" },
    });
    expect(resolved).toEqual(data);
  });

  it("invalidates POI, detail, and lists cache on success", async () => {
    const listId = "list-1";
    vi.mocked(removePoiFromList).mockResolvedValue(apiResponse({ data: { message: "POI removed" } }));
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useRemovePoiFromList(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ listId, savedPoiId: "saved-1" });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.lists.pois.all(listId),
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.lists.detail(listId),
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.lists.all });
    });
  });

  it("throws API error when response has no data", async () => {
    const apiError = { message: "Not found" };
    vi.mocked(removePoiFromList).mockResolvedValue(apiResponse({ error: apiError }));

    const { result } = renderHook(() => useRemovePoiFromList(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ listId: "list-1", savedPoiId: "saved-1" });
      })
    ).rejects.toEqual(apiError);
  });
});
