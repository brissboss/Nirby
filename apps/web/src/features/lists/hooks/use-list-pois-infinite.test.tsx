import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LIST_POIS_PAGE_SIZE } from "./use-list-pois";
import { useListPoisInfinite } from "./use-list-pois-infinite";

const getListPois = vi.fn();
const useAuth = vi.fn();

vi.mock("@/features/auth", () => ({
  useAuth: () => useAuth(),
}));

vi.mock("@/lib/api", () => ({
  getListPois: (...args: unknown[]) => getListPois(...args),
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useListPoisInfinite", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    useAuth.mockReturnValue({ user: { id: "user-1" } });
    getListPois.mockResolvedValue({
      data: { pois: [{ id: "poi-1" }], pagination: { page: 1, totalPages: 1, total: 1 } },
    });
  });

  it("does not fetch when listId is undefined", () => {
    renderHook(() => useListPoisInfinite(undefined), {
      wrapper: createWrapper(queryClient),
    });

    expect(getListPois).not.toHaveBeenCalled();
  });

  it("does not fetch when user is absent", () => {
    useAuth.mockReturnValue({ user: null });

    renderHook(() => useListPoisInfinite("list-1"), {
      wrapper: createWrapper(queryClient),
    });

    expect(getListPois).not.toHaveBeenCalled();
  });

  it("fetches first page with default limit", async () => {
    const { result } = renderHook(() => useListPoisInfinite("list-1"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getListPois).toHaveBeenCalledWith({
      path: { listId: "list-1" },
      query: { page: 1, limit: LIST_POIS_PAGE_SIZE },
    });
    expect(result.current.data?.pages[0]).toEqual({
      pois: [{ id: "poi-1" }],
      pagination: { page: 1, totalPages: 1, total: 1 },
    });
  });

  it("passes custom limit filter on first page", async () => {
    renderHook(() => useListPoisInfinite("list-1", { limit: 10 }), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(getListPois).toHaveBeenCalledWith({
        path: { listId: "list-1" },
        query: { page: 1, limit: 10 },
      });
    });
  });
});
