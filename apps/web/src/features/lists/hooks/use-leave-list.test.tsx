import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLeaveList } from "./use-leave-list";

import { leaveList } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

vi.mock("@/lib/api", () => ({
  leaveList: vi.fn(),
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function apiResponse(value: { data?: unknown; error?: unknown }) {
  return value as Awaited<ReturnType<typeof leaveList>>;
}

describe("useLeaveList", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  it("calls leaveList and returns data on success", async () => {
    const data = { message: "List left successfully" };
    vi.mocked(leaveList).mockResolvedValue(apiResponse({ data }));

    const { result } = renderHook(() => useLeaveList(), {
      wrapper: createWrapper(queryClient),
    });

    let resolved: unknown;
    await act(async () => {
      resolved = await result.current.mutateAsync({ listId: "list-1" });
    });

    expect(leaveList).toHaveBeenCalledWith({ path: { listId: "list-1" } });
    expect(resolved).toEqual(data);
  });

  it("invalidates collaborator and list caches on success", async () => {
    vi.mocked(leaveList).mockResolvedValue(
      apiResponse({ data: { message: "List left successfully" } })
    );
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useLeaveList(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ listId: "list-1" });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.lists.collaborators.all("list-1"),
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.lists.detail("list-1") });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.lists.all });
    });
  });

  it("throws API error when response has no data", async () => {
    const apiError = { message: "Forbidden" };
    vi.mocked(leaveList).mockResolvedValue(apiResponse({ error: apiError }));

    const { result } = renderHook(() => useLeaveList(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ listId: "list-1" });
      })
    ).rejects.toEqual(apiError);
  });
});
