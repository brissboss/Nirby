import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLists } from "./use-lists";

import { getLists } from "@/lib/api";

const useAuth = vi.fn();

vi.mock("@/features/auth", () => ({
  useAuth: () => useAuth(),
}));

vi.mock("@/lib/api", () => ({
  getLists: vi.fn(),
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function apiResponse(value: { data?: unknown; error?: unknown }) {
  return value as Awaited<ReturnType<typeof getLists>>;
}

describe("useLists", () => {
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

    renderHook(() => useLists(), { wrapper: createWrapper(queryClient) });

    expect(getLists).not.toHaveBeenCalled();
  });

  it("fetches lists with filters when the user is present", async () => {
    const data = {
      lists: [{ id: "list-1", name: "Paris" }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };
    vi.mocked(getLists).mockResolvedValue(apiResponse({ data }));
    const filters = { page: 1, limit: 20 };

    const { result } = renderHook(() => useLists(filters), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getLists).toHaveBeenCalledWith({ query: filters });
    expect(result.current.data).toEqual(data);
  });

  it("throws API error when response has no data", async () => {
    const apiError = { message: "Unauthorized" };
    vi.mocked(getLists).mockResolvedValue(apiResponse({ error: apiError }));

    const { result } = renderHook(() => useLists(), { wrapper: createWrapper(queryClient) });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error).toEqual(apiError);
  });
});
