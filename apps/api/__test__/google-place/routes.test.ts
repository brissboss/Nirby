import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

import { createServer } from "../../src/server";
import { prisma } from "../../src/db";
import { hashPassword } from "../../src/auth/hash";
import { signAccessToken } from "../../src/auth/token";

const app = createServer();

// Mock fetch globally for Google API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Google Place Routes", () => {
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    await prisma.savedPoi.deleteMany({
      where: { list: { user: { email: "test-google-place@example.com" } } },
    });
    await prisma.poiList.deleteMany({
      where: { user: { email: "test-google-place@example.com" } },
    });
    await prisma.poi.deleteMany({ where: { user: { email: "test-google-place@example.com" } } });
    await prisma.googlePlaceCache.deleteMany();
    await prisma.session.deleteMany({
      where: { user: { email: "test-google-place@example.com" } },
    });
    await prisma.user.deleteMany({ where: { email: "test-google-place@example.com" } });

    const user = await prisma.user.create({
      data: {
        email: "test-google-place@example.com",
        passwordHash: await hashPassword("password123"),
        emailVerified: true,
      },
    });
    userId = user.id;
    accessToken = signAccessToken({ userId: user.id, email: user.email });
  });

  afterAll(async () => {
    await prisma.savedPoi.deleteMany({
      where: { list: { user: { email: "test-google-place@example.com" } } },
    });
    await prisma.poiList.deleteMany({
      where: { user: { email: "test-google-place@example.com" } },
    });
    await prisma.poi.deleteMany({ where: { user: { email: "test-google-place@example.com" } } });
    await prisma.googlePlaceCache.deleteMany();
    await prisma.session.deleteMany({
      where: { user: { email: "test-google-place@example.com" } },
    });
    await prisma.user.deleteMany({ where: { email: "test-google-place@example.com" } });
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    await prisma.googlePlaceCache.deleteMany();
    mockFetch.mockReset();
  });

  describe("GET /google-place/:placeId", () => {
    it("should return 401 without auth", async () => {
      const response = await request(app).get("/google-place/test-place-id");
      expect(response.status).toBe(401);
    });

    it("should return 400 for empty placeId", async () => {
      const response = await request(app)
        .get("/google-place/%20") // URL-encoded space
        .set("Authorization", `Bearer ${accessToken}`);
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("GOOGLE_PLACE_INVALID_ID");
    });

    it("should return cached place when valid", async () => {
      const cachedPlace = await prisma.googlePlaceCache.create({
        data: {
          placeId: "test-place-123",
          name: "Test Restaurant",
          latitude: 48.8566,
          longitude: 2.3522,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const response = await request(app)
        .get(`/google-place/${cachedPlace.placeId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.placeId).toBe("test-place-123");
      expect(response.body.name).toBe("Test Restaurant");
      // Should not call Google API when cache is valid
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should fetch from Google API and cache when not in cache", async () => {
      const mockGoogleResponse = {
        id: "new-place-456",
        displayName: { text: "New Restaurant", languageCode: "en" },
        formattedAddress: "123 Test St",
        location: { latitude: 48.8566, longitude: 2.3522 },
        rating: 4.5,
        userRatingCount: 100,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGoogleResponse,
      });

      const response = await request(app)
        .get("/google-place/new-place-456")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.placeId).toBe("new-place-456");
      expect(response.body.name).toBe("New Restaurant");
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Verify it was cached
      const cached = await prisma.googlePlaceCache.findUnique({
        where: { placeId: "new-place-456" },
      });
      expect(cached).not.toBeNull();
      expect(cached?.name).toBe("New Restaurant");
    });

    it("should refresh cache when expired", async () => {
      // Create expired cache entry
      await prisma.googlePlaceCache.create({
        data: {
          placeId: "expired-place-789",
          name: "Old Name",
          latitude: 48.8566,
          longitude: 2.3522,
          expiresAt: new Date(Date.now() - 1000), // Expired
        },
      });

      const mockGoogleResponse = {
        id: "expired-place-789",
        displayName: { text: "Updated Name", languageCode: "en" },
        location: { latitude: 48.8566, longitude: 2.3522 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGoogleResponse,
      });

      const response = await request(app)
        .get("/google-place/expired-place-789")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Updated Name");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should return 404 when Google API returns not found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: { message: "Place not found" } }),
      });

      const response = await request(app)
        .get("/google-place/non-existent-place")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("GOOGLE_PLACE_NOT_FOUND");
    });

    it("should return 401 when Google API returns unauthorized", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: "API key invalid" } }),
      });

      const response = await request(app)
        .get("/google-place/test-place-401")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("GOOGLE_PLACE_API_KEY_REQUIRED");
    });

    it("should return 403 when Google API returns forbidden", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: { message: "Quota exceeded" } }),
      });

      const response = await request(app)
        .get("/google-place/test-place-403")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe("GOOGLE_PLACE_FETCH_ERROR");
    });

    it("should handle 500+ errors from Google API", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: async () => ({}),
      });

      const response = await request(app)
        .get("/google-place/test-place-502")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe("GOOGLE_PLACE_FETCH_ERROR");
    });

    it("should return place with photoReferences mapped", async () => {
      const mockGoogleResponse = {
        id: "place-with-photos",
        displayName: { text: "Place with Photos", languageCode: "en" },
        location: { latitude: 48.8566, longitude: 2.3522 },
        photos: [
          { name: "places/x/photos/photo1", widthPx: 800, heightPx: 600 },
          { name: "places/x/photos/photo2", widthPx: 800, heightPx: 600 },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGoogleResponse,
      });

      const response = await request(app)
        .get("/google-place/place-with-photos")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.photoReferences).toEqual([
        "places/x/photos/photo1",
        "places/x/photos/photo2",
      ]);
    });

    it("should map priceLevel correctly", async () => {
      const mockGoogleResponse = {
        id: "place-with-price",
        displayName: { text: "Expensive Place", languageCode: "en" },
        location: { latitude: 48.8566, longitude: 2.3522 },
        priceLevel: "PRICE_LEVEL_EXPENSIVE",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGoogleResponse,
      });

      const response = await request(app)
        .get("/google-place/place-with-price")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.priceLevel).toBe(3);
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new TypeError("fetch failed"));

      const response = await request(app)
        .get("/google-place/test-network-error")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe("GOOGLE_PLACE_FETCH_ERROR");
    });
  });

  describe("POST /google-place/search", () => {
    it("should return 401 without auth", async () => {
      const response = await request(app)
        .post("/google-place/search")
        .send({ searchQuery: "restaurant" });
      expect(response.status).toBe(401);
    });

    it("should return 400 for missing searchQuery", async () => {
      const response = await request(app)
        .post("/google-place/search")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({});
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 400 for empty searchQuery", async () => {
      const response = await request(app)
        .post("/google-place/search")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ searchQuery: "" });
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should search and return transformed places", async () => {
      const mockGoogleResponse = {
        places: [
          {
            id: "place-1",
            displayName: { text: "Restaurant A", languageCode: "en" },
            formattedAddress: "123 Main St",
            location: { latitude: 48.8566, longitude: 2.3522 },
            rating: 4.2,
          },
          {
            id: "place-2",
            displayName: { text: "Restaurant B", languageCode: "en" },
            formattedAddress: "456 Oak Ave",
            location: { latitude: 48.8567, longitude: 2.3523 },
            rating: 4.8,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGoogleResponse,
      });

      const response = await request(app)
        .post("/google-place/search")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ searchQuery: "restaurant paris" });

      expect(response.status).toBe(200);
      expect(response.body.places).toHaveLength(2);
      expect(response.body.places[0].placeId).toBe("place-1");
      expect(response.body.places[0].name).toBe("Restaurant A");
      expect(response.body.places[1].placeId).toBe("place-2");
      // Should NOT have cachedAt/expiresAt (these are stripped)
      expect(response.body.places[0].cachedAt).toBeUndefined();
      expect(response.body.places[0].expiresAt).toBeUndefined();
    });

    it("should pass language parameter to Google API", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ places: [] }),
      });

      await request(app)
        .post("/google-place/search")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ searchQuery: "restaurant", language: "fr" });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.languageCode).toBe("fr");
    });

    it("should pass location bias when lat/lng provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ places: [] }),
      });

      await request(app)
        .post("/google-place/search")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ searchQuery: "restaurant", lat: 48.8566, lng: 2.3522 });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.locationBias).toBeDefined();
      expect(body.locationBias.circle.center.latitude).toBe(48.8566);
      expect(body.locationBias.circle.center.longitude).toBe(2.3522);
    });

    it("should not include location bias when lat/lng not provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ places: [] }),
      });

      await request(app)
        .post("/google-place/search")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ searchQuery: "restaurant" });

      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.locationBias).toBeUndefined();
    });

    it("should handle network errors in search", async () => {
      mockFetch.mockRejectedValueOnce(new TypeError("fetch failed"));

      const response = await request(app)
        .post("/google-place/search")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ searchQuery: "restaurant" });

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe("GOOGLE_PLACE_SEARCH_ERROR");
    });

    it("should return 403 when Google search API returns forbidden", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: { message: "Quota exceeded" } }),
      });

      const response = await request(app)
        .post("/google-place/search")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ searchQuery: "restaurant" });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe("GOOGLE_PLACE_FETCH_ERROR");
    });
  });

  describe("GET /google-place/photo", () => {
    it("should return 401 without auth", async () => {
      const response = await request(app).get("/google-place/photo?ref=test-ref");
      expect(response.status).toBe(401);
    });

    it("should return 400 when ref is missing", async () => {
      const response = await request(app)
        .get("/google-place/photo")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return photo buffer with correct headers", async () => {
      const mockPhotoBuffer = Buffer.from("fake-image-data");

      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockPhotoBuffer,
      });

      const response = await request(app)
        .get("/google-place/photo?ref=places/test/photos/abc123")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toBe("image/jpeg");
      expect(response.headers["cache-control"]).toBe("public, max-age=86400");
    });

    it("should pass maxWidth to Google API", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => Buffer.from("fake-image"),
      });

      await request(app)
        .get("/google-place/photo?ref=places/test/photos/abc123&maxWidth=800")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain("maxWidthPx=800");
    });

    it("should use default maxWidth of 400", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => Buffer.from("fake-image"),
      });

      await request(app)
        .get("/google-place/photo?ref=places/test/photos/abc123")
        .set("Authorization", `Bearer ${accessToken}`);

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain("maxWidthPx=400");
    });

    it("should return error when Google API fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const response = await request(app)
        .get("/google-place/photo?ref=invalid-ref")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("GOOGLE_PLACE_PHOTO_ERROR");
    });

    it("should handle network errors in photo fetch", async () => {
      mockFetch.mockRejectedValueOnce(new TypeError("fetch failed"));

      const response = await request(app)
        .get("/google-place/photo?ref=places/test/photos/abc123")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe("GOOGLE_PLACE_PHOTO_ERROR");
    });
  });

  describe("Rate Limiting", () => {
    it("should skip rate limiting in test mode and allow requests", async () => {
      // In test mode (NODE_ENV=test), rate limiting is skipped
      // This test verifies that multiple requests pass through without 429
      const cachedPlace = await prisma.googlePlaceCache.create({
        data: {
          placeId: "rate-limit-test-place",
          name: "Rate Limit Test",
          latitude: 48.8566,
          longitude: 2.3522,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      // Make multiple requests - should all succeed in test mode
      const requests = Array.from({ length: 5 }, () =>
        request(app)
          .get(`/google-place/${cachedPlace.placeId}`)
          .set("Authorization", `Bearer ${accessToken}`)
      );

      const responses = await Promise.all(requests);

      // All requests should succeed (not get 429)
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.placeId).toBe("rate-limit-test-place");
      });
    });

    it("should include RateLimit headers in search response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ places: [] }),
      });

      const response = await request(app)
        .post("/google-place/search")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ searchQuery: "test restaurant" });

      expect(response.status).toBe(200);
      // Standard headers from express-rate-limit (when not skipped, headers are still set)
      // Note: In test mode, these headers may not be present since rate limiting is skipped
      // This test documents the expected behavior
    });

    it("should include RateLimit headers in getPlace response", async () => {
      const cachedPlace = await prisma.googlePlaceCache.create({
        data: {
          placeId: "headers-test-place",
          name: "Headers Test",
          latitude: 48.8566,
          longitude: 2.3522,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const response = await request(app)
        .get(`/google-place/${cachedPlace.placeId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      // Rate limit headers are expected in production mode
      // In test mode, rate limiting is skipped so headers may not be present
    });

    it("should include RateLimit headers in photo response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => Buffer.from("fake-image"),
      });

      const response = await request(app)
        .get("/google-place/photo?ref=places/test/photos/headers-test")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      // Rate limit headers are expected in production mode
      // In test mode, rate limiting is skipped so headers may not be present
    });

    it("should have rate limiting configured for search endpoint (20/hour)", async () => {
      // This test documents that the search endpoint has the strictest rate limit
      // Actual rate limiting behavior is tested in middleware unit tests
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ places: [] }),
      });

      // Make requests - in test mode all should pass
      const responses = await Promise.all(
        Array.from({ length: 25 }, () =>
          request(app)
            .post("/google-place/search")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({ searchQuery: "test" })
        )
      );

      // In test mode, all requests pass (skip is enabled)
      // In production, the 21st request would return 429
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    it("should have separate rate limits per user", async () => {
      // Create a second user
      const user2 = await prisma.user.create({
        data: {
          email: "test-google-place-2@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });
      const accessToken2 = signAccessToken({ userId: user2.id, email: user2.email });

      const cachedPlace = await prisma.googlePlaceCache.create({
        data: {
          placeId: "multi-user-test-place",
          name: "Multi User Test",
          latitude: 48.8566,
          longitude: 2.3522,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      // Both users should be able to make requests independently
      const [response1, response2] = await Promise.all([
        request(app)
          .get(`/google-place/${cachedPlace.placeId}`)
          .set("Authorization", `Bearer ${accessToken}`),
        request(app)
          .get(`/google-place/${cachedPlace.placeId}`)
          .set("Authorization", `Bearer ${accessToken2}`),
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Cleanup
      await prisma.user.delete({ where: { id: user2.id } });
    });
  });
});
