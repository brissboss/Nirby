import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCreateList } from "./use-create-list";

import { createList } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

vi.mock("@/lib/api", () => ({
  createList: vi.fn(),
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

/** The hook only forwards the payload, so a partial response is enough here. */
function apiResponse(value: { data?: unknown; error?: unknown }) {
  return value as Awaited<ReturnType<typeof createList>>;
}

describe("useCreateList", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  it("calls createList and returns data on success", async () => {
    const input = { name: "Paris", visibility: "PRIVATE" as const };
    const data = { list: { id: "list-1", name: "Paris", visibility: "PRIVATE" } };
    vi.mocked(createList).mockResolvedValue(apiResponse({ data }));

    const { result } = renderHook(() => useCreateList(), {
      wrapper: createWrapper(queryClient),
    });

    let resolved: unknown;
    await act(async () => {
      resolved = await result.current.mutateAsync(input);
    });

    expect(createList).toHaveBeenCalledWith({ body: input });
    expect(resolved).toEqual(data);
  });

  it("invalidates lists cache on success", async () => {
    vi.mocked(createList).mockResolvedValue(
      apiResponse({ data: { list: { id: "list-1", name: "Paris" } } })
    );
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateList(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ name: "Paris", visibility: "PRIVATE" });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.lists.all });
    });
  });

  it("throws API error when response has no data", async () => {
    const apiError = { message: "Forbidden" };
    vi.mocked(createList).mockResolvedValue(apiResponse({ error: apiError }));

    const { result } = renderHook(() => useCreateList(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ name: "Paris", visibility: "PRIVATE" });
      })
    ).rejects.toEqual(apiError);
  });
});
