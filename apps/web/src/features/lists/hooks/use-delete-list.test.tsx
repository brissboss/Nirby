import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDeleteList } from "./use-delete-list";

import { deleteList } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

vi.mock("@/lib/api", () => ({
  deleteList: vi.fn(),
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useDeleteList", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  it("calls deleteList and returns data on success", async () => {
    const listId = "list-1";
    const data = { success: true };
    vi.mocked(deleteList).mockResolvedValue({ data, error: undefined });

    const { result } = renderHook(() => useDeleteList(), {
      wrapper: createWrapper(queryClient),
    });

    let resolved: typeof data | undefined;
    await act(async () => {
      resolved = await result.current.mutateAsync(listId);
    });

    expect(deleteList).toHaveBeenCalledWith({ path: { listId } });
    expect(resolved).toEqual(data);
  });

  it("invalidates lists and removes detail cache on success", async () => {
    const listId = "list-1";
    vi.mocked(deleteList).mockResolvedValue({
      data: { success: true },
      error: undefined,
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const removeSpy = vi.spyOn(queryClient, "removeQueries");

    const { result } = renderHook(() => useDeleteList(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync(listId);
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.lists.all });
      expect(removeSpy).toHaveBeenCalledWith({ queryKey: queryKeys.lists.detail(listId) });
    });
  });

  it("throws API error when response has no data", async () => {
    const apiError = { message: "Not found" };
    vi.mocked(deleteList).mockResolvedValue({ data: undefined, error: apiError });

    const { result } = renderHook(() => useDeleteList(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync("list-1");
      })
    ).rejects.toEqual(apiError);
  });
});
