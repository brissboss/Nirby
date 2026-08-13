import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "../../src/db";
import { hydrateExpiredGooglePlaceCaches } from "../../src/google-place/cache-utils";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("hydrateExpiredGooglePlaceCaches", () => {
  beforeEach(async () => {
    await prisma.savedPoi.deleteMany();
    await prisma.poiList.deleteMany();
    await prisma.googlePlaceCache.deleteMany();
    await prisma.user.deleteMany();
    mockFetch.mockReset();
    vi.stubEnv("GOOGLE_PLACES_API_KEY", "test-api-key");
  });

  it("refreshes expired google place caches attached to saved pois", async () => {
    const user = await prisma.user.create({
      data: {
        email: "cache-utils@test.com",
        passwordHash: "hash",
        emailVerified: true,
      },
    });

    await prisma.googlePlaceCache.create({
      data: {
        placeId: "ChIJexpired-place",
        name: "Expired Place",
        latitude: 48.85,
        longitude: 2.35,
        photoReferences: ["places/ChIJexpired-place/photos/old"],
        expiresAt: new Date(Date.now() - 1000),
      },
    });

    const list = await prisma.poiList.create({
      data: { name: "Test", createdBy: user.id },
    });

    const savedPoi = await prisma.savedPoi.create({
      data: {
        listId: list.id,
        googlePlaceId: "ChIJexpired-place",
      },
      include: { poi: true, googlePlaceCache: true },
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "ChIJexpired-place",
        displayName: { text: "Updated Place", languageCode: "fr" },
        location: { latitude: 48.85, longitude: 2.35 },
        photos: [{ name: "places/ChIJexpired-place/photos/new", widthPx: 800, heightPx: 600 }],
      }),
    });

    const [hydrated] = await hydrateExpiredGooglePlaceCaches([savedPoi], "fr");

    expect(hydrated.googlePlaceCache?.name).toBe("Updated Place");
    expect(hydrated.googlePlaceCache?.photoReferences).toEqual([
      "places/ChIJexpired-place/photos/new",
    ]);
  });

  it("leaves fresh caches untouched", async () => {
    const user = await prisma.user.create({
      data: {
        email: "cache-utils-fresh@test.com",
        passwordHash: "hash",
        emailVerified: true,
      },
    });

    await prisma.googlePlaceCache.create({
      data: {
        placeId: "ChIJfresh-place",
        name: "Fresh Place",
        latitude: 48.85,
        longitude: 2.35,
        photoReferences: ["places/ChIJfresh-place/photos/current"],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const list = await prisma.poiList.create({
      data: { name: "Test", createdBy: user.id },
    });

    const savedPoi = await prisma.savedPoi.create({
      data: {
        listId: list.id,
        googlePlaceId: "ChIJfresh-place",
      },
      include: { poi: true, googlePlaceCache: true },
    });

    const [hydrated] = await hydrateExpiredGooglePlaceCaches([savedPoi], "fr");

    expect(hydrated.googlePlaceCache?.name).toBe("Fresh Place");
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
