import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { normalizeGooglePlaceIds, usePoiListMembership } from "./use-poi-list-membership";

const getPoiListMembership = vi.fn();

vi.mock("@/features/auth", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

vi.mock("@/lib/api", () => ({
  getPoiListMembership: (...args: unknown[]) => getPoiListMembership(...args),
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("normalizeGooglePlaceIds", () => {
  it("deduplicates and sorts place IDs", () => {
    expect(normalizeGooglePlaceIds(["b", "a", "b"])).toEqual(["a", "b"]);
  });
});

describe("usePoiListMembership", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    getPoiListMembership.mockResolvedValue({
      data: { membership: { "gp-1": ["list-1"] } },
    });
  });

  it("does not fetch when there are no place IDs", () => {
    renderHook(() => usePoiListMembership([]), {
      wrapper: createWrapper(queryClient),
    });

    expect(getPoiListMembership).not.toHaveBeenCalled();
  });

  it("fetches membership with normalized place IDs", async () => {
    renderHook(() => usePoiListMembership(["gp-2", "gp-1", "gp-2"]), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(getPoiListMembership).toHaveBeenCalledWith({
        body: { googlePlaceIds: ["gp-1", "gp-2"] },
      });
    });
  });
});
