import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";

import { createServer } from "../../src/server";
import { prisma } from "../../src/db";
import { hashPassword } from "../../src/auth/hash";
import { signAccessToken } from "../../src/auth/token";

const app = createServer();

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
  });

  beforeEach(async () => {
    await prisma.googlePlaceCache.deleteMany();
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

    it("should return 404 when place not in cache", async () => {
      const response = await request(app)
        .get("/google-place/non-existent-place-id")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("GOOGLE_PLACE_NOT_FOUND");
    });

    it("should return cached place", async () => {
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
    });

    it("should return 404 for expired cache", async () => {
      await prisma.googlePlaceCache.create({
        data: {
          placeId: "expired-place-123",
          name: "Expired Restaurant",
          latitude: 48.8566,
          longitude: 2.3522,
          expiresAt: new Date(Date.now() - 1000),
        },
      });

      const response = await request(app)
        .get("/google-place/expired-place-123")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe("GOOGLE_PLACE_NOT_FOUND");
    });
  });
});
