import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useListPois } from "./use-list-pois";

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

describe("useListPois", () => {
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
    renderHook(() => useListPois(undefined), {
      wrapper: createWrapper(queryClient),
    });

    expect(getListPois).not.toHaveBeenCalled();
  });

  it("does not fetch when user is absent", () => {
    useAuth.mockReturnValue({ user: null });

    renderHook(() => useListPois("list-1"), {
      wrapper: createWrapper(queryClient),
    });

    expect(getListPois).not.toHaveBeenCalled();
  });

  it("fetches POIs with listId and filters", async () => {
    const filters = { page: 1, limit: 10 };
    const { result } = renderHook(() => useListPois("list-1", filters), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getListPois).toHaveBeenCalledWith({
      path: { listId: "list-1" },
      query: filters,
    });
    expect(result.current.data).toEqual({
      pois: [{ id: "poi-1" }],
      pagination: { page: 1, totalPages: 1, total: 1 },
    });
  });

  it("throws API error when response has no data", async () => {
    const apiError = { message: "Not found" };
    getListPois.mockResolvedValue({ error: apiError });

    const { result } = renderHook(() => useListPois("list-1"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(apiError);
  });
});
