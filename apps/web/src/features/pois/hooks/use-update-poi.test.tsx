import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUpdatePoi } from "./use-update-poi";

import { updatePoi } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

vi.mock("@/lib/api", () => ({
  updatePoi: vi.fn(),
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function apiResponse(value: { data?: unknown; error?: unknown }) {
  return value as Awaited<ReturnType<typeof updatePoi>>;
}

describe("useUpdatePoi", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  it("calls updatePoi and returns data on success", async () => {
    const input = {
      poiId: "poi-1",
      listId: "list-1",
      body: { name: "Updated spot" },
    };
    const data = { poi: { id: "poi-1", name: "Updated spot" } };
    vi.mocked(updatePoi).mockResolvedValue(apiResponse({ data }));

    const { result } = renderHook(() => useUpdatePoi(), {
      wrapper: createWrapper(queryClient),
    });

    let resolved: unknown;
    await act(async () => {
      resolved = await result.current.mutateAsync(input);
    });

    expect(updatePoi).toHaveBeenCalledWith({
      path: { id: "poi-1" },
      body: { name: "Updated spot" },
    });
    expect(resolved).toEqual(data);
  });

  it("invalidates POI and list caches on success when listId is set", async () => {
    vi.mocked(updatePoi).mockResolvedValue(
      apiResponse({ data: { poi: { id: "poi-1", name: "Updated spot" } } })
    );
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdatePoi(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        poiId: "poi-1",
        listId: "list-1",
        body: { name: "Updated spot" },
      });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.pois.all });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.pois.detail("poi-1") });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.lists.pois.all("list-1"),
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.lists.detail("list-1"),
      });
    });
  });

  it("does not invalidate list caches when listId is omitted", async () => {
    vi.mocked(updatePoi).mockResolvedValue(
      apiResponse({ data: { poi: { id: "poi-1", name: "Updated spot" } } })
    );
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdatePoi(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        poiId: "poi-1",
        body: { name: "Updated spot" },
      });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.pois.all });
    });

    expect(invalidateSpy).not.toHaveBeenCalledWith({
      queryKey: queryKeys.lists.pois.all("list-1"),
    });
  });

  it("throws API error when response has no data", async () => {
    const apiError = { message: "Forbidden" };
    vi.mocked(updatePoi).mockResolvedValue(apiResponse({ error: apiError }));

    const { result } = renderHook(() => useUpdatePoi(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          poiId: "poi-1",
          body: { name: "Updated spot" },
        });
      })
    ).rejects.toEqual(apiError);
  });
});
