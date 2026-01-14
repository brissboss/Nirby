import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";

import { createServer } from "../../src/server";
import { prisma } from "../../src/db";
import { hashPassword } from "../../src/auth/hash";
import { signAccessToken } from "../../src/auth/token";

const app = createServer();

describe("POI Routes", () => {
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    await prisma.listCollaborator.deleteMany();
    await prisma.savedPoi.deleteMany();
    await prisma.poiList.deleteMany();
    await prisma.poi.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.listCollaborator.deleteMany();
    await prisma.savedPoi.deleteMany();
    await prisma.poiList.deleteMany();
    await prisma.poi.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  beforeEach(async () => {
    await prisma.listCollaborator.deleteMany();
    await prisma.savedPoi.deleteMany();
    await prisma.poiList.deleteMany();
    await prisma.poi.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: {
        email: "test-poi@example.com",
        passwordHash: await hashPassword("password123"),
        emailVerified: true,
      },
    });

    userId = user.id;
    accessToken = signAccessToken({ userId: user.id, email: user.email });
  });

  describe("POST /poi", () => {
    it("should create a POI successfully", async () => {
      const res = await request(app)
        .post("/poi")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Test POI",
          description: "Test description",
          address: "Test address",
          latitude: 40.7128,
          longitude: -74.006,
          visibility: "PRIVATE",
        });

      expect(res.status).toBe(201);
      expect(res.body.poi.name).toBe("Test POI");
      expect(res.body.poi.createdBy).toBe(userId);
    });

    it("should fail without authentication", async () => {
      const res = await request(app).post("/poi").send({
        name: "Test POI",
        latitude: 40.7128,
        longitude: -74.006,
      });

      expect(res.status).toBe(401);
    });

    it("should fail with missing name", async () => {
      const res = await request(app)
        .post("/poi")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          latitude: 40.7128,
          longitude: -74.006,
        });

      expect(res.status).toBe(400);
    });

    it("should fail with invalid latitude", async () => {
      const res = await request(app)
        .post("/poi")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Test POI",
          latitude: 100,
          longitude: 2.3522,
        });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /poi", () => {
    it("should return paginated POIs", async () => {
      await prisma.poi.createMany({
        data: [
          { name: "POI 1", latitude: 48.8566, longitude: 2.3522, createdBy: userId },
          { name: "POI 2", latitude: 48.8567, longitude: 2.3523, createdBy: userId },
          { name: "POI 3", latitude: 48.8568, longitude: 2.3524, createdBy: userId },
        ],
      });

      const res = await request(app).get("/poi").set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.pois).toHaveLength(3);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBe(3);
    });

    it("should respect limit parameter", async () => {
      await prisma.poi.createMany({
        data: [
          { name: "POI 1", latitude: 48.8566, longitude: 2.3522, createdBy: userId },
          { name: "POI 2", latitude: 48.8567, longitude: 2.3523, createdBy: userId },
        ],
      });

      const res = await request(app)
        .get("/poi")
        .set("Authorization", `Bearer ${accessToken}`)
        .query({ limit: 1 });

      expect(res.status).toBe(200);
      expect(res.body.pois).toHaveLength(1);
      expect(res.body.pagination.totalPages).toBe(2);
    });

    it("should fail without authentication", async () => {
      const res = await request(app).get("/poi");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /poi/:id", () => {
    it("should return a POI by id", async () => {
      const poi = await prisma.poi.create({
        data: {
          name: "Test POI",
          latitude: 40.7128,
          longitude: -74.006,
          createdBy: userId,
        },
      });

      const res = await request(app)
        .get(`/poi/${poi.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Test POI");
    });

    it("should return 404 for non-existent POI", async () => {
      const res = await request(app)
        .get(`/poi/non-existent-id`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });

    it("should deny access to another user's private POI", async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: "other-user@example.com",
          passwordHash: "hash",
          emailVerified: true,
        },
      });

      const poi = await prisma.poi.create({
        data: {
          name: "Private POI",
          latitude: 40.7128,
          longitude: -74.006,
          createdBy: otherUser.id,
          visibility: "PRIVATE",
        },
      });

      const res = await request(app)
        .get(`/poi/${poi.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("PUT /poi/:id", () => {
    it("should update a POI", async () => {
      const poi = await prisma.poi.create({
        data: {
          name: "Test POI",
          latitude: 40.7128,
          longitude: -74.006,
          createdBy: userId,
        },
      });

      const res = await request(app)
        .put(`/poi/${poi.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Updated POI",
        });

      expect(res.status).toBe(200);
      expect(res.body.poi.name).toBe("Updated POI");
    });

    it("should deny update to another user's POI", async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: "other-user@example.com",
          passwordHash: "hash",
          emailVerified: true,
        },
      });

      const poi = await prisma.poi.create({
        data: {
          name: "Private POI",
          latitude: 40.7128,
          longitude: -74.006,
          createdBy: otherUser.id,
          visibility: "PRIVATE",
        },
      });

      const res = await request(app)
        .put(`/poi/${poi.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Updated POI",
        });

      expect(res.status).toBe(403);
    });

    it("should return 404 for non-existent POI", async () => {
      const res = await request(app)
        .put(`/poi/non-existent-id`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Updated POI",
        });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /poi/:id", () => {
    it("should delete a POI", async () => {
      const poi = await prisma.poi.create({
        data: {
          name: "To Delete",
          latitude: 40.7128,
          longitude: -74.006,
          createdBy: userId,
        },
      });

      const res = await request(app)
        .delete(`/poi/${poi.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);

      const deleted = await prisma.poi.findUnique({
        where: { id: poi.id },
      });

      expect(deleted).toBeNull();
    });

    it("should deny delete to another user's POI", async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: "other-user@example.com",
          passwordHash: "hash",
          emailVerified: true,
        },
      });

      const poi = await prisma.poi.create({
        data: {
          name: "To Delete",
          latitude: 40.7128,
          longitude: -74.006,
          createdBy: otherUser.id,
        },
      });

      const res = await request(app)
        .delete(`/poi/${poi.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(403);
    });

    it("should return 404 for non-existent POI", async () => {
      const res = await request(app)
        .delete(`/poi/non-existent-id`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("GET /poi/nearby", () => {
    it("should return nearby POIs from user's lists", async () => {
      // Create a list and add POIs to it
      const list = await prisma.poiList.create({
        data: { name: "My List", createdBy: userId },
      });

      // Create POIs (trigger will set location automatically)
      const poi1 = await prisma.poi.create({
        data: {
          name: "Nearby POI",
          latitude: 48.8566, // Paris
          longitude: 2.3522,
          createdBy: userId,
        },
      });

      const poi2 = await prisma.poi.create({
        data: {
          name: "Far POI",
          latitude: 51.5074, // London (far from Paris)
          longitude: -0.1278,
          createdBy: userId,
        },
      });

      // Save POIs to list
      await prisma.savedPoi.createMany({
        data: [
          { listId: list.id, poiId: poi1.id },
          { listId: list.id, poiId: poi2.id },
        ],
      });

      const res = await request(app)
        .get("/poi/nearby")
        .set("Authorization", `Bearer ${accessToken}`)
        .query({ latitude: 48.8566, longitude: 2.3522, radius: 1000 });

      expect(res.status).toBe(200);
      expect(res.body.pois).toHaveLength(1);
      expect(res.body.pois[0].name).toBe("Nearby POI");
      expect(res.body.pois[0].distance).toBeDefined();
      expect(res.body.pois[0].distance).toBeLessThan(1000);
    });

    it("should return POIs sorted by distance", async () => {
      const list = await prisma.poiList.create({
        data: { name: "My List", createdBy: userId },
      });

      const poi1 = await prisma.poi.create({
        data: {
          name: "POI 500m away",
          latitude: 48.861,
          longitude: 2.3522,
          createdBy: userId,
        },
      });

      const poi2 = await prisma.poi.create({
        data: {
          name: "POI 100m away",
          latitude: 48.8575,
          longitude: 2.3522,
          createdBy: userId,
        },
      });

      await prisma.savedPoi.createMany({
        data: [
          { listId: list.id, poiId: poi1.id },
          { listId: list.id, poiId: poi2.id },
        ],
      });

      const res = await request(app)
        .get("/poi/nearby")
        .set("Authorization", `Bearer ${accessToken}`)
        .query({ latitude: 48.8566, longitude: 2.3522, radius: 5000 });

      expect(res.status).toBe(200);
      expect(res.body.pois).toHaveLength(2);
      expect(res.body.pois[0].name).toBe("POI 100m away");
      expect(res.body.pois[1].name).toBe("POI 500m away");
      expect(res.body.pois[0].distance).toBeLessThan(res.body.pois[1].distance);
    });

    it("should include POIs from lists where user is collaborator", async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: "other-nearby@example.com",
          passwordHash: "hash",
          emailVerified: true,
        },
      });

      const otherList = await prisma.poiList.create({
        data: { name: "Other List", createdBy: otherUser.id },
      });

      // Add user as collaborator
      await prisma.listCollaborator.create({
        data: { listId: otherList.id, userId: userId, role: "VIEWER" },
      });

      const poi = await prisma.poi.create({
        data: {
          name: "Collaborator POI",
          latitude: 48.8566,
          longitude: 2.3522,
          createdBy: otherUser.id,
        },
      });

      await prisma.savedPoi.create({
        data: { listId: otherList.id, poiId: poi.id },
      });

      const res = await request(app)
        .get("/poi/nearby")
        .set("Authorization", `Bearer ${accessToken}`)
        .query({ latitude: 48.8566, longitude: 2.3522, radius: 1000 });

      expect(res.status).toBe(200);
      expect(res.body.pois).toHaveLength(1);
      expect(res.body.pois[0].name).toBe("Collaborator POI");
    });

    it("should not include POIs from lists user has no access to", async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: "stranger-nearby@example.com",
          passwordHash: "hash",
          emailVerified: true,
        },
      });

      const privateList = await prisma.poiList.create({
        data: { name: "Private List", createdBy: otherUser.id, visibility: "PRIVATE" },
      });

      const poi = await prisma.poi.create({
        data: {
          name: "Private POI",
          latitude: 48.8566,
          longitude: 2.3522,
          createdBy: otherUser.id,
        },
      });

      await prisma.savedPoi.create({
        data: { listId: privateList.id, poiId: poi.id },
      });

      const res = await request(app)
        .get("/poi/nearby")
        .set("Authorization", `Bearer ${accessToken}`)
        .query({ latitude: 48.8566, longitude: 2.3522, radius: 1000 });

      expect(res.status).toBe(200);
      expect(res.body.pois).toHaveLength(0);
    });

    it("should return empty array when no POIs in radius", async () => {
      const list = await prisma.poiList.create({
        data: { name: "My List", createdBy: userId },
      });

      const poi = await prisma.poi.create({
        data: {
          name: "Far POI",
          latitude: 51.5074, // London
          longitude: -0.1278,
          createdBy: userId,
        },
      });

      await prisma.savedPoi.create({
        data: { listId: list.id, poiId: poi.id },
      });

      const res = await request(app)
        .get("/poi/nearby")
        .set("Authorization", `Bearer ${accessToken}`)
        .query({ latitude: 48.8566, longitude: 2.3522, radius: 1000 }); // Paris

      expect(res.status).toBe(200);
      expect(res.body.pois).toHaveLength(0);
    });

    it("should use default radius when not provided", async () => {
      const list = await prisma.poiList.create({
        data: { name: "My List", createdBy: userId },
      });

      const poi = await prisma.poi.create({
        data: {
          name: "Nearby POI",
          latitude: 48.857,
          longitude: 2.3522,
          createdBy: userId,
        },
      });

      await prisma.savedPoi.create({
        data: { listId: list.id, poiId: poi.id },
      });

      const res = await request(app)
        .get("/poi/nearby")
        .set("Authorization", `Bearer ${accessToken}`)
        .query({ latitude: 48.8566, longitude: 2.3522 }); // No radius = default 1000m

      expect(res.status).toBe(200);
      expect(res.body.pois).toHaveLength(1);
    });

    it("should fail without authentication", async () => {
      const res = await request(app)
        .get("/poi/nearby")
        .query({ latitude: 48.8566, longitude: 2.3522, radius: 1000 });

      expect(res.status).toBe(401);
    });

    it("should fail with invalid latitude", async () => {
      const res = await request(app)
        .get("/poi/nearby")
        .set("Authorization", `Bearer ${accessToken}`)
        .query({ latitude: 100, longitude: 2.3522, radius: 1000 });

      expect(res.status).toBe(400);
    });

    it("should fail with invalid longitude", async () => {
      const res = await request(app)
        .get("/poi/nearby")
        .set("Authorization", `Bearer ${accessToken}`)
        .query({ latitude: 48.8566, longitude: 200, radius: 1000 });

      expect(res.status).toBe(400);
    });

    it("should fail with radius exceeding maximum", async () => {
      const res = await request(app)
        .get("/poi/nearby")
        .set("Authorization", `Bearer ${accessToken}`)
        .query({ latitude: 48.8566, longitude: 2.3522, radius: 100000 });

      expect(res.status).toBe(400);
    });

    it("should fail with missing latitude", async () => {
      const res = await request(app)
        .get("/poi/nearby")
        .set("Authorization", `Bearer ${accessToken}`)
        .query({ longitude: 2.3522, radius: 1000 });

      expect(res.status).toBe(400);
    });

    it("should fail with missing longitude", async () => {
      const res = await request(app)
        .get("/poi/nearby")
        .set("Authorization", `Bearer ${accessToken}`)
        .query({ latitude: 48.8566, radius: 1000 });

      expect(res.status).toBe(400);
    });
  });
});
