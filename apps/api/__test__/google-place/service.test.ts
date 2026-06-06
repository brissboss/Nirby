import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "../../src/db";
import {
  extractPlaceIdFromPhotoRef,
  getPhotoWithCacheRefresh,
  refreshPlaceCache,
} from "../../src/google-place/service";

const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockValidPhotoFetch() {
  const buffer = Buffer.alloc(2000, 0);
  buffer[0] = 0xff;
  buffer[1] = 0xd8;
  buffer[2] = 0xff;

  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ photoUri: "https://example.com/photo.jpg" }),
  });
  mockFetch.mockResolvedValueOnce({
    ok: true,
    arrayBuffer: async () => buffer,
  });
}

describe("Google Place service", () => {
  beforeEach(async () => {
    await prisma.googlePlaceCache.deleteMany();
    mockFetch.mockReset();
    vi.stubEnv("GOOGLE_PLACES_API_KEY", "test-api-key");
  });

  describe("extractPlaceIdFromPhotoRef", () => {
    it("extracts place id from a photo resource name", () => {
      expect(extractPlaceIdFromPhotoRef("places/ChIJabc123/photos/AcnlKN0test")).toBe("ChIJabc123");
    });

    it("returns null for invalid refs", () => {
      expect(extractPlaceIdFromPhotoRef("invalid-ref")).toBeNull();
    });
  });

  describe("getPhotoWithCacheRefresh", () => {
    it("refreshes place cache and retries with fresh refs when photo fetch fails", async () => {
      const staleRef = "places/ChIJrefresh-test/photos/stale-ref";
      const freshRef = "places/ChIJrefresh-test/photos/fresh-ref";

      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "ChIJrefresh-test",
          displayName: { text: "Refreshed Place", languageCode: "fr" },
          location: { latitude: 48.85, longitude: 2.35 },
          photos: [{ name: freshRef, widthPx: 800, heightPx: 600 }],
        }),
      });

      mockValidPhotoFetch();

      const buffer = await getPhotoWithCacheRefresh(staleRef, 400);

      expect(buffer.length).toBeGreaterThan(1000);

      const cached = await prisma.googlePlaceCache.findUnique({
        where: { placeId: "ChIJrefresh-test" },
      });
      expect(cached?.photoReferences).toEqual([freshRef]);
    });
  });

  describe("refreshPlaceCache", () => {
    it("always fetches fresh data from Google", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "ChIJforce-refresh",
          displayName: { text: "Fresh Place", languageCode: "fr" },
          location: { latitude: 48.85, longitude: 2.35 },
          photos: [{ name: "places/ChIJforce-refresh/photos/new", widthPx: 800, heightPx: 600 }],
        }),
      });

      await prisma.googlePlaceCache.create({
        data: {
          placeId: "ChIJforce-refresh",
          name: "Stale Place",
          latitude: 48.85,
          longitude: 2.35,
          photoReferences: ["places/ChIJforce-refresh/photos/old"],
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const refreshed = await refreshPlaceCache("ChIJforce-refresh", "fr");

      expect(refreshed.name).toBe("Fresh Place");
      expect(refreshed.photoReferences).toEqual(["places/ChIJforce-refresh/photos/new"]);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
