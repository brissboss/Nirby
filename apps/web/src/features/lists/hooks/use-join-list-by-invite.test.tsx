import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useJoinListByInvite } from "./use-join-list-by-invite";

import { joinListByInvite } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

vi.mock("@/lib/api", () => ({
  joinListByInvite: vi.fn(),
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function apiResponse(value: { data?: unknown; error?: unknown }) {
  return value as Awaited<ReturnType<typeof joinListByInvite>>;
}

describe("useJoinListByInvite", () => {
  let queryClient: QueryClient;
  const joinedList = { id: "list-1", name: "Paris" };
  const input = { listId: "list-1", token: "invite-token" };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  it("calls joinListByInvite and returns data on success", async () => {
    const data = { list: joinedList };
    vi.mocked(joinListByInvite).mockResolvedValue(apiResponse({ data }));

    const { result } = renderHook(() => useJoinListByInvite(), {
      wrapper: createWrapper(queryClient),
    });

    let resolved: unknown;
    await act(async () => {
      resolved = await result.current.mutateAsync(input);
    });

    expect(joinListByInvite).toHaveBeenCalledWith({
      path: { listId: "list-1" },
      query: { token: "invite-token" },
    });
    expect(resolved).toEqual(data);
  });

  it("invalidates list caches on success", async () => {
    vi.mocked(joinListByInvite).mockResolvedValue(apiResponse({ data: { list: joinedList } }));
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useJoinListByInvite(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync(input);
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.lists.all });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.lists.detail("list-1") });
    });
  });

  it("throws API error when response has no data", async () => {
    const apiError = { message: "Invalid token" };
    vi.mocked(joinListByInvite).mockResolvedValue(apiResponse({ error: apiError }));

    const { result } = renderHook(() => useJoinListByInvite(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync(input);
      })
    ).rejects.toEqual(apiError);
  });
});
