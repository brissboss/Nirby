import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAddPoiToList } from "./use-add-poi-to-list";

import { addPoiToList } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

vi.mock("@/lib/api", () => ({
  addPoiToList: vi.fn(),
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function apiResponse(value: { data?: unknown; error?: unknown }) {
  return value as Awaited<ReturnType<typeof addPoiToList>>;
}

describe("useAddPoiToList", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  it("calls addPoiToList and returns data on success", async () => {
    const input = {
      listId: "list-1",
      body: { googlePlaceId: "place-1" },
    };
    const data = { savedPoi: { id: "saved-1", googlePlaceId: "place-1" } };
    vi.mocked(addPoiToList).mockResolvedValue(apiResponse({ data }));

    const { result } = renderHook(() => useAddPoiToList(), {
      wrapper: createWrapper(queryClient),
    });

    let resolved: unknown;
    await act(async () => {
      resolved = await result.current.mutateAsync(input);
    });

    expect(addPoiToList).toHaveBeenCalledWith({
      path: { listId: "list-1" },
      body: { googlePlaceId: "place-1" },
    });
    expect(resolved).toEqual(data);
  });

  it("calls addPoiToList with poiId and returns data on success", async () => {
    const input = {
      listId: "list-1",
      body: { poiId: "poi-1" },
    };
    const data = { savedPoi: { id: "saved-1", poiId: "poi-1" } };
    vi.mocked(addPoiToList).mockResolvedValue(apiResponse({ data }));

    const { result } = renderHook(() => useAddPoiToList(), {
      wrapper: createWrapper(queryClient),
    });

    let resolved: unknown;
    await act(async () => {
      resolved = await result.current.mutateAsync(input);
    });

    expect(addPoiToList).toHaveBeenCalledWith({
      path: { listId: "list-1" },
      body: { poiId: "poi-1" },
    });
    expect(resolved).toEqual(data);
  });

  it("invalidates POI, detail, and lists cache on success", async () => {
    const listId = "list-1";
    vi.mocked(addPoiToList).mockResolvedValue(
      apiResponse({ data: { savedPoi: { id: "saved-1" } } })
    );
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useAddPoiToList(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ listId, body: { googlePlaceId: "place-1" } });
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
    const apiError = { message: "Forbidden" };
    vi.mocked(addPoiToList).mockResolvedValue(apiResponse({ error: apiError }));

    const { result } = renderHook(() => useAddPoiToList(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          listId: "list-1",
          body: { googlePlaceId: "place-1" },
        });
      })
    ).rejects.toEqual(apiError);
  });
});
