import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSearchGooglePlaces } from "./use-search-google-places";

const searchGooglePlaces = vi.fn();

vi.mock("@/features/auth", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

vi.mock("@/features/map", () => ({
  useMap: () => ({
    userPosition: { lat: 48.8566, lng: 2.3522 },
  }),
}));

vi.mock("@/lib/api", () => ({
  searchGooglePlaces: (...args: unknown[]) => searchGooglePlaces(...args),
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useSearchGooglePlaces", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    searchGooglePlaces.mockResolvedValue({
      data: { places: [{ placeId: "p1", name: "Café" }] },
    });
  });

  it("does not fetch when query is below min length", () => {
    renderHook(() => useSearchGooglePlaces("c"), {
      wrapper: createWrapper(queryClient),
    });

    expect(searchGooglePlaces).not.toHaveBeenCalled();
  });

  it("fetches with lat/lng when query is long enough", async () => {
    renderHook(() => useSearchGooglePlaces("café"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(searchGooglePlaces).toHaveBeenCalledWith({
        body: {
          searchQuery: "café",
          language: "en",
          lat: 48.857,
          lng: 2.352,
        },
      });
    });
  });
});
