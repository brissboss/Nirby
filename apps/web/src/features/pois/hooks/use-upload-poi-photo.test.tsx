import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUploadPoiPhoto } from "./use-upload-poi-photo";

import { uploadPoiPhoto } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";

vi.mock("@/lib/api", () => ({
  uploadPoiPhoto: vi.fn(),
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function apiResponse(value: { data?: unknown; error?: unknown }) {
  return value as Awaited<ReturnType<typeof uploadPoiPhoto>>;
}

describe("useUploadPoiPhoto", () => {
  let queryClient: QueryClient;
  const file = new File(["photo"], "spot.webp", { type: "image/webp" });

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  it("calls uploadPoiPhoto and returns data on success", async () => {
    const input = { file, poiId: "poi-1" };
    const data = { url: "https://cdn.example.com/poi-1.webp" };
    vi.mocked(uploadPoiPhoto).mockResolvedValue(apiResponse({ data }));

    const { result } = renderHook(() => useUploadPoiPhoto(), {
      wrapper: createWrapper(queryClient),
    });

    let resolved: unknown;
    await act(async () => {
      resolved = await result.current.mutateAsync(input);
    });

    expect(uploadPoiPhoto).toHaveBeenCalledWith({ body: input });
    expect(resolved).toEqual(data);
  });

  it("invalidates poi detail and all pois when poiId is provided", async () => {
    vi.mocked(uploadPoiPhoto).mockResolvedValue(
      apiResponse({ data: { url: "https://cdn.example.com/poi-1.webp" } })
    );
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUploadPoiPhoto(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ file, poiId: "poi-1" });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.pois.detail("poi-1"),
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.pois.all });
    });
  });

  it("does not invalidate cache when poiId is omitted", async () => {
    vi.mocked(uploadPoiPhoto).mockResolvedValue(
      apiResponse({ data: { url: "https://cdn.example.com/pending.webp" } })
    );
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUploadPoiPhoto(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ file });
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("throws API error when response has no data", async () => {
    const apiError = { message: "File too large" };
    vi.mocked(uploadPoiPhoto).mockResolvedValue(apiResponse({ error: apiError }));

    const { result } = renderHook(() => useUploadPoiPhoto(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ file });
      })
    ).rejects.toEqual(apiError);
  });
});
