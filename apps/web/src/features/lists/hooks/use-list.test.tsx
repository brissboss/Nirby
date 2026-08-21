import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useList } from "./use-list";

import { getListById } from "@/lib/api";

const useAuth = vi.fn();

vi.mock("@/features/auth", () => ({
  useAuth: () => useAuth(),
}));

vi.mock("@/lib/api", () => ({
  getListById: vi.fn(),
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function apiResponse(value: { data?: unknown; error?: unknown }) {
  return value as Awaited<ReturnType<typeof getListById>>;
}

describe("useList", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    useAuth.mockReturnValue({ user: { id: "user-1" } });
  });

  it("does not fetch when listId is undefined", () => {
    renderHook(() => useList(undefined), { wrapper: createWrapper(queryClient) });

    expect(getListById).not.toHaveBeenCalled();
  });

  it("does not fetch when the user is absent", () => {
    useAuth.mockReturnValue({ user: null });

    renderHook(() => useList("list-1"), { wrapper: createWrapper(queryClient) });

    expect(getListById).not.toHaveBeenCalled();
  });

  it("fetches a list by id", async () => {
    const data = { list: { id: "list-1", name: "Paris" } };
    vi.mocked(getListById).mockResolvedValue(apiResponse({ data }));

    const { result } = renderHook(() => useList("list-1"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getListById).toHaveBeenCalledWith({ path: { listId: "list-1" } });
    expect(result.current.data).toEqual(data);
  });

  it("throws API error when response has no data", async () => {
    const apiError = { message: "Not found" };
    vi.mocked(getListById).mockResolvedValue(apiResponse({ error: apiError }));

    const { result } = renderHook(() => useList("list-1"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error).toEqual(apiError);
  });
});
