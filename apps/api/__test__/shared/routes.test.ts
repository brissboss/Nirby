import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";

import { createServer } from "../../src/server";
import { prisma } from "../../src/db";
import { hashPassword } from "../../src/auth/hash";
import { ErrorCodes } from "../../src/utils/error-codes";

const app = createServer();

describe("Shared Routes", () => {
  let ownerId: string;
  let listId: string;
  let shareToken: string;

  beforeAll(async () => {
    await prisma.savedPoi.deleteMany();
    await prisma.poiList.deleteMany();
    await prisma.poi.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    const owner = await prisma.user.create({
      data: {
        email: "owner@example.com",
        passwordHash: await hashPassword("password123"),
        emailVerified: true,
        name: "List Owner",
        avatarUrl: "https://example.com/avatar.jpg",
      },
    });

    ownerId = owner.id;
  });

  afterAll(async () => {
    await prisma.savedPoi.deleteMany();
    await prisma.poiList.deleteMany();
    await prisma.poi.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.savedPoi.deleteMany();
    await prisma.poiList.deleteMany();
    await prisma.poi.deleteMany();

    const list = await prisma.poiList.create({
      data: {
        name: "Shared Test List",
        description: "A test list for sharing",
        createdBy: ownerId,
        shareToken: "test-share-token-123",
        shareTokenExpiresAt: null,
      },
    });

    listId = list.id;
    shareToken = list.shareToken!;
  });

  describe("GET /shared/:shareToken", () => {
    it("should return a shared list without authentication", async () => {
      const res = await request(app).get(`/shared/${shareToken}`);

      expect(res.status).toBe(200);
      expect(res.body.list).toHaveProperty("id", listId);
      expect(res.body.list).toHaveProperty("name", "Shared Test List");
      expect(res.body.list).toHaveProperty("description", "A test list for sharing");
      expect(res.body.list).toHaveProperty("creator");
      expect(res.body.list.creator).toHaveProperty("name", "List Owner");
      expect(res.body.list.creator).toHaveProperty("avatarUrl", "https://example.com/avatar.jpg");
      expect(res.body.list).not.toHaveProperty("createdBy");
    });

    it("should return 404 for invalid token", async () => {
      const res = await request(app).get("/shared/invalid-token");

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe(ErrorCodes.LIST_NOT_FOUND);
    });

    it("should return 404 for non-existent token", async () => {
      const res = await request(app).get("/shared/non-existent-token-xyz");

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe(ErrorCodes.LIST_NOT_FOUND);
    });

    it("should return 404 for expired token", async () => {
      const expiredList = await prisma.poiList.create({
        data: {
          name: "Expired List",
          createdBy: ownerId,
          shareToken: "expired-token",
          shareTokenExpiresAt: new Date(Date.now() - 1000), // Expired
        },
      });

      const res = await request(app).get("/shared/expired-token");

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe(ErrorCodes.SHARE_TOKEN_EXPIRED);
    });

    it("should work even if token has no expiration (null)", async () => {
      const res = await request(app).get(`/shared/${shareToken}`);

      expect(res.status).toBe(200);
      expect(res.body.list.name).toBe("Shared Test List");
    });

    it("should exclude sensitive fields from response", async () => {
      const res = await request(app).get(`/shared/${shareToken}`);

      expect(res.status).toBe(200);
      expect(res.body.list).not.toHaveProperty("createdBy");
    });

    it("should return creator info even if user has no name or avatar", async () => {
      const userWithoutProfile = await prisma.user.create({
        data: {
          email: "noprofile@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const list = await prisma.poiList.create({
        data: {
          name: "List without profile",
          createdBy: userWithoutProfile.id,
          shareToken: "no-profile-token",
          shareTokenExpiresAt: null,
        },
      });

      const res = await request(app).get("/shared/no-profile-token");

      expect(res.status).toBe(200);
      expect(res.body.list.creator.name).toBeNull();
      expect(res.body.list.creator.avatarUrl).toBeNull();
    });
  });

  describe("GET /shared/:shareToken/pois", () => {
    it("should return POIs from a shared list without authentication", async () => {
      const poi = await prisma.poi.create({
        data: {
          name: "Test POI",
          description: "A test POI",
          latitude: 48.8566,
          longitude: 2.3522,
          createdBy: ownerId,
        },
      });

      await prisma.savedPoi.create({
        data: {
          listId: listId,
          poiId: poi.id,
        },
      });

      const res = await request(app).get(`/shared/${shareToken}/pois`);

      expect(res.status).toBe(200);
      expect(res.body.pois).toHaveLength(1);
      expect(res.body.pois[0]).toHaveProperty("name", "Test POI");
      expect(res.body.pois[0]).toHaveProperty("description", "A test POI");
      expect(res.body.pois[0]).not.toHaveProperty("createdBy");
    });

    it("should return Google Place Cache POIs", async () => {
      const googlePlace = await prisma.googlePlaceCache.create({
        data: {
          placeId: "test-place-id",
          name: "Google Place",
          latitude: 48.8566,
          longitude: 2.3522,
        },
      });

      await prisma.savedPoi.create({
        data: {
          listId: listId,
          googlePlaceId: googlePlace.placeId,
        },
      });

      const res = await request(app).get(`/shared/${shareToken}/pois`);

      expect(res.status).toBe(200);
      expect(res.body.pois).toHaveLength(1);
      expect(res.body.pois[0]).toHaveProperty("name", "Google Place");
      expect(res.body.pois[0]).toHaveProperty("placeId", "test-place-id");
    });

    it("should return mixed POI and Google Place Cache", async () => {
      const poi = await prisma.poi.create({
        data: {
          name: "Custom POI",
          latitude: 48.8566,
          longitude: 2.3522,
          createdBy: ownerId,
        },
      });

      const googlePlace = await prisma.googlePlaceCache.create({
        data: {
          placeId: "place-123",
          name: "Google Place",
          latitude: 48.8566,
          longitude: 2.3522,
        },
      });

      await prisma.savedPoi.createMany({
        data: [
          { listId: listId, poiId: poi.id },
          { listId: listId, googlePlaceId: googlePlace.placeId },
        ],
      });

      const res = await request(app).get(`/shared/${shareToken}/pois`);

      expect(res.status).toBe(200);
      expect(res.body.pois).toHaveLength(2);
      expect(res.body.pois.some((p: any) => p.name === "Custom POI")).toBe(true);
      expect(res.body.pois.some((p: any) => p.name === "Google Place")).toBe(true);
    });

    it("should return empty array if list has no POIs", async () => {
      const res = await request(app).get(`/shared/${shareToken}/pois`);

      expect(res.status).toBe(200);
      expect(res.body.pois).toEqual([]);
    });

    it("should return 404 for invalid token", async () => {
      const res = await request(app).get("/shared/invalid-token/pois");

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe(ErrorCodes.LIST_NOT_FOUND);
    });

    it("should return 404 for expired token", async () => {
      const expiredList = await prisma.poiList.create({
        data: {
          name: "Expired List",
          createdBy: ownerId,
          shareToken: "expired-token-2",
          shareTokenExpiresAt: new Date(Date.now() - 1000),
        },
      });

      const res = await request(app).get("/shared/expired-token-2/pois");

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe(ErrorCodes.SHARE_TOKEN_EXPIRED);
    });

    it("should exclude createdBy from custom POIs", async () => {
      const poi = await prisma.poi.create({
        data: {
          name: "Test POI",
          latitude: 48.8566,
          longitude: 2.3522,
          createdBy: ownerId,
        },
      });

      await prisma.savedPoi.create({
        data: {
          listId: listId,
          poiId: poi.id,
        },
      });

      const res = await request(app).get(`/shared/${shareToken}/pois`);

      expect(res.status).toBe(200);
      expect(res.body.pois[0]).not.toHaveProperty("createdBy");
    });

    it("should filter out null values", async () => {
      // Créer un savedPoi sans poi ni googlePlaceCache (cas edge)
      await prisma.savedPoi.create({
        data: {
          listId: listId,
          poiId: null,
          googlePlaceId: null,
        },
      });

      const poi = await prisma.poi.create({
        data: {
          name: "Valid POI",
          latitude: 48.8566,
          longitude: 2.3522,
          createdBy: ownerId,
        },
      });

      await prisma.savedPoi.create({
        data: {
          listId: listId,
          poiId: poi.id,
        },
      });

      const res = await request(app).get(`/shared/${shareToken}/pois`);

      expect(res.status).toBe(200);
      expect(res.body.pois).toHaveLength(1);
      expect(res.body.pois[0].name).toBe("Valid POI");
    });
  });
});
