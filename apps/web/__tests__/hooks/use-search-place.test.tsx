import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { useSearchPlace } from "@/features/browse/hooks";
import { queryKeys } from "@/lib/api/query-keys";

vi.mock("@/lib/api", () => ({
  searchGooglePlaces: vi.fn(),
}));

const { searchGooglePlaces } = await import("@/lib/api");

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useSearchPlace", () => {
  beforeEach(() => {
    vi.mocked(searchGooglePlaces).mockReset();
  });

  describe("initial state and returned API", () => {
    it("should return all expected properties (mutate, isPending, data, lastSearchQueryText, setLastSearchQueryText, clearResults)", () => {
      vi.mocked(searchGooglePlaces).mockResolvedValue({
        data: { places: [] },
        error: undefined,
      });

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useSearchPlace(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current).toHaveProperty("mutate");
      expect(result.current).toHaveProperty("isPending");
      expect(result.current).toHaveProperty("data");
      expect(result.current).toHaveProperty("lastSearchQueryText");
      expect(result.current).toHaveProperty("setLastSearchQueryText");
      expect(result.current).toHaveProperty("clearResults");
      expect(result.current).toHaveProperty("isError");
      expect(result.current).toHaveProperty("error");
    });

    it("should return empty lastSearchQueryText and no data initially", () => {
      vi.mocked(searchGooglePlaces).mockResolvedValue({
        data: { places: [] },
        error: undefined,
      });

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useSearchPlace(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.data).toBeUndefined();
      expect(["", undefined]).toContain(result.current.lastSearchQueryText);
    });
  });

  describe("mutate", () => {
    it("should call searchGooglePlaces with searchQuery when mutate is called", async () => {
      vi.mocked(searchGooglePlaces).mockResolvedValue({
        data: { places: [] },
        error: undefined,
      });

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useSearchPlace(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({ searchQuery: "Paris" });

      await waitFor(() => {
        expect(searchGooglePlaces).toHaveBeenCalledWith(
          expect.objectContaining({
            body: expect.objectContaining({ searchQuery: "Paris" }),
          })
        );
      });
    });

    it("should pass optional language, lat, and lng to searchGooglePlaces when provided", async () => {
      vi.mocked(searchGooglePlaces).mockResolvedValue({
        data: { places: [] },
        error: undefined,
      });

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useSearchPlace(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        searchQuery: "restaurant",
        lat: 48.8566,
        lng: 2.3522,
      });

      await waitFor(() => {
        expect(searchGooglePlaces).toHaveBeenCalledWith(
          expect.objectContaining({
            body: expect.objectContaining({
              searchQuery: "restaurant",
              lat: 48.8566,
              lng: 2.3522,
            }),
          })
        );
      });
    });
  });

  describe("cache updates on success", () => {
    it("should update lastSearch and lastSearchQuery in cache on successful mutation", async () => {
      const mockPlaces = [{ placeId: "1", name: "Tour Eiffel", address: null, nameLang: null }];
      vi.mocked(searchGooglePlaces).mockResolvedValue({
        data: { places: mockPlaces },
        error: undefined,
      });

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useSearchPlace(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({ searchQuery: "Paris" });

      await waitFor(() => {
        expect(result.current.data).toEqual({ places: mockPlaces });
        expect(result.current.lastSearchQueryText).toBe("Paris");
      });

      expect(queryClient.getQueryData(queryKeys.places.lastSearch)).toEqual({
        places: mockPlaces,
      });
      expect(queryClient.getQueryData(queryKeys.places.lastSearchQuery)).toBe("Paris");
    });

    it("should set query key for search(query) in cache on success", async () => {
      const mockPlaces = [{ placeId: "2", name: "Lyon", address: null, nameLang: null }];
      vi.mocked(searchGooglePlaces).mockResolvedValue({
        data: { places: mockPlaces },
        error: undefined,
      });

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useSearchPlace(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({ searchQuery: "Lyon" });

      await waitFor(() => {
        expect(queryClient.getQueryData(queryKeys.places.search("Lyon"))).toEqual({
          places: mockPlaces,
        });
      });
    });
  });

  describe("error handling", () => {
    it("should set isError and error when searchGooglePlaces returns an error", async () => {
      const apiError = { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } };
      vi.mocked(searchGooglePlaces).mockResolvedValue({
        data: undefined,
        error: apiError,
      });

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useSearchPlace(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({ searchQuery: "Paris" });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toEqual(apiError);
      });
    });
  });

  describe("clearResults", () => {
    it("should clear lastSearch and lastSearchQuery in cache when clearResults is called", async () => {
      vi.mocked(searchGooglePlaces).mockResolvedValue({
        data: { places: [{ placeId: "1", name: "X", address: null, nameLang: null }] },
        error: undefined,
      });

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useSearchPlace(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({ searchQuery: "test" });
      await waitFor(() => expect(result.current.data).toBeDefined());

      result.current.clearResults();

      expect(queryClient.getQueryData(queryKeys.places.lastSearch)).toEqual({
        places: [],
      });
      expect(queryClient.getQueryData(queryKeys.places.lastSearchQuery)).toBe("");
    });
  });

  describe("setLastSearchQueryText", () => {
    it("should update lastSearchQuery in cache when setLastSearchQueryText is called", () => {
      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useSearchPlace(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.setLastSearchQueryText("Lyon");

      expect(queryClient.getQueryData(queryKeys.places.lastSearchQuery)).toBe("Lyon");
    });
  });
});
