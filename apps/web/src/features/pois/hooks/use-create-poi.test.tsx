import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCreatePoi } from "./use-create-poi";

import { createPoi } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

vi.mock("@/lib/api", () => ({
  createPoi: vi.fn(),
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

/** The hook only forwards the payload, so a partial response is enough here. */
function apiResponse(value: { data?: unknown; error?: unknown }) {
  return value as Awaited<ReturnType<typeof createPoi>>;
}

describe("useCreatePoi", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  it("calls createPoi and returns data on success", async () => {
    const input = { name: "Secret spot", latitude: 48.8566, longitude: 2.3522 };
    const data = { poi: { id: "poi-1", name: "Secret spot" } };
    vi.mocked(createPoi).mockResolvedValue(apiResponse({ data }));

    const { result } = renderHook(() => useCreatePoi(), {
      wrapper: createWrapper(queryClient),
    });

    let resolved: unknown;
    await act(async () => {
      resolved = await result.current.mutateAsync(input);
    });

    expect(createPoi).toHaveBeenCalledWith({ body: input });
    expect(resolved).toEqual(data);
  });

  it("invalidates pois cache on success", async () => {
    vi.mocked(createPoi).mockResolvedValue(
      apiResponse({ data: { poi: { id: "poi-1", name: "Secret spot" } } })
    );
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreatePoi(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        name: "Secret spot",
        latitude: 48.8566,
        longitude: 2.3522,
      });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.pois.all });
    });
  });

  it("throws API error when response has no data", async () => {
    const apiError = { message: "Forbidden" };
    vi.mocked(createPoi).mockResolvedValue(apiResponse({ error: apiError }));

    const { result } = renderHook(() => useCreatePoi(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          name: "Secret spot",
          latitude: 48.8566,
          longitude: 2.3522,
        });
      })
    ).rejects.toEqual(apiError);
  });
});
