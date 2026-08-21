import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useListsInfinite } from "./use-lists-infinite";

import { getLists } from "@/lib/api";

const useAuth = vi.fn();

vi.mock("@/features/auth", () => ({
  useAuth: () => useAuth(),
}));

vi.mock("@/lib/api", () => ({
  getLists: vi.fn(),
}));

function page(pageNumber: number, totalPages: number) {
  return {
    lists: [{ id: `list-${pageNumber}`, name: `Page ${pageNumber}` }],
    pagination: { page: pageNumber, limit: 20, total: 40, totalPages },
  };
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useListsInfinite", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    useAuth.mockReturnValue({ user: { id: "user-1" } });
  });

  it("does not fetch when the user is absent", () => {
    useAuth.mockReturnValue({ user: null });

    renderHook(() => useListsInfinite(), { wrapper: createWrapper(queryClient) });

    expect(getLists).not.toHaveBeenCalled();
  });

  it("fetches the first page and exposes the next page param", async () => {
    vi.mocked(getLists).mockResolvedValue({ data: page(1, 2) } as Awaited<
      ReturnType<typeof getLists>
    >);

    const { result } = renderHook(() => useListsInfinite({ visibility: "PRIVATE" }), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getLists).toHaveBeenCalledWith({
      query: { visibility: "PRIVATE", page: 1, limit: 20 },
    });
    expect(result.current.hasNextPage).toBe(true);
  });

  it("fetches the next page until totalPages is reached", async () => {
    vi.mocked(getLists)
      .mockResolvedValueOnce({ data: page(1, 2) } as Awaited<ReturnType<typeof getLists>>)
      .mockResolvedValueOnce({ data: page(2, 2) } as Awaited<ReturnType<typeof getLists>>);

    const { result } = renderHook(() => useListsInfinite(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.hasNextPage).toBe(true);
    });

    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() => {
      expect(result.current.hasNextPage).toBe(false);
    });

    expect(getLists).toHaveBeenNthCalledWith(2, {
      query: { page: 2, limit: 20 },
    });
    expect(result.current.data?.pages).toHaveLength(2);
  });

  it("throws API error when a page has no data", async () => {
    const apiError = { message: "Unauthorized" };
    vi.mocked(getLists).mockResolvedValue({ error: apiError } as Awaited<
      ReturnType<typeof getLists>
    >);

    const { result } = renderHook(() => useListsInfinite(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error).toEqual(apiError);
  });
});
