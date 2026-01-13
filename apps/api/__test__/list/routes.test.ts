import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";

import { createServer } from "../../src/server";
import { prisma } from "../../src/db";
import { hashPassword } from "../../src/auth/hash";
import { signAccessToken } from "../../src/auth/token";
import { ErrorCodes } from "../../src/utils/error-codes";

const app = createServer();

describe("List Routes", () => {
  let userId: string;
  let accessToken: string;

  beforeAll(async () => {
    await prisma.savedPoi.deleteMany();
    await prisma.poiList.deleteMany();
    await prisma.poi.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: {
        email: "test-list@example.com",
        passwordHash: await hashPassword("password123"),
        emailVerified: true,
      },
    });

    userId = user.id;
    accessToken = signAccessToken({ userId: user.id, email: user.email });
  });

  afterAll(async () => {
    await prisma.savedPoi.deleteMany();
    await prisma.poiList.deleteMany();
    await prisma.poi.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  beforeEach(async () => {
    await prisma.savedPoi.deleteMany();
    await prisma.poiList.deleteMany();
    await prisma.poi.deleteMany();
  });

  describe("POST /list", () => {
    it("should create a list successfully", async () => {
      const res = await request(app)
        .post("/list")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Test List",
        });

      expect(res.status).toBe(201);
      expect(res.body.list.name).toBe("Test List");
      expect(res.body.list.createdBy).toBe(userId);
    });

    it("should fail without authentication", async () => {
      const res = await request(app).post("/list").send({ name: "Test List" });
      expect(res.status).toBe(401);
    });

    it("should fail with missing name", async () => {
      const res = await request(app)
        .post("/list")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe("GET /list", () => {
    it("should return paginated lists", async () => {
      await prisma.poiList.createMany({
        data: [
          { name: "List 1", createdBy: userId },
          { name: "List 2", createdBy: userId },
        ],
      });

      const res = await request(app).get("/list").set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.lists.length).toBe(2);
      expect(res.body.pagination).toBeDefined();
    });

    it("should fail without authentication", async () => {
      const res = await request(app).get("/list");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /list/:id", () => {
    it("should return a list by id", async () => {
      const list = await prisma.poiList.create({
        data: {
          name: "Test List",
          createdBy: userId,
        },
      });

      const res = await request(app)
        .get(`/list/${list.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.list.name).toBe("Test List");
    });

    it("should return 404 for non-existent list", async () => {
      const res = await request(app)
        .get(`/list/non-existent-id`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /list/:id", () => {
    it("should update a list", async () => {
      const list = await prisma.poiList.create({
        data: {
          name: "Old name",
          createdBy: userId,
        },
      });

      const res = await request(app)
        .put(`/list/${list.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "New name",
        });

      expect(res.status).toBe(200);
      expect(res.body.list.name).toBe("New name");
    });

    it("should return 404 for non-existent list", async () => {
      const res = await request(app)
        .put(`/list/non-existent-id`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "New name",
        });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /list/:id", () => {
    it("should delete a list", async () => {
      const list = await prisma.poiList.create({
        data: {
          name: "To delete",
          createdBy: userId,
        },
      });

      const res = await request(app)
        .delete(`/list/${list.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);

      const deletedList = await prisma.poiList.findUnique({
        where: { id: list.id },
      });

      expect(deletedList).toBeNull();
    });

    it("should return 404 for non-existent list", async () => {
      const res = await request(app)
        .delete(`/list/non-existent-id`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /list/:listId/poi", () => {
    it("should add a POI to a list", async () => {
      const list = await prisma.poiList.create({
        data: {
          name: "Test List",
          createdBy: userId,
        },
      });

      const poi = await prisma.poi.create({
        data: {
          name: "Test POI",
          latitude: 0,
          longitude: 0,
          createdBy: userId,
        },
      });

      const res = await request(app)
        .post(`/list/${list.id}/poi`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          poiId: poi.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.savedPoi.poiId).toBe(poi.id);
    });

    it("should fail if POI already in list", async () => {
      const list = await prisma.poiList.create({
        data: {
          name: "Test List",
          createdBy: userId,
        },
      });

      const poi = await prisma.poi.create({
        data: {
          name: "Test POI",
          latitude: 0,
          longitude: 0,
          createdBy: userId,
        },
      });

      await prisma.savedPoi.create({
        data: {
          listId: list.id,
          poiId: poi.id,
        },
      });

      const res = await request(app)
        .post(`/list/${list.id}/poi`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          poiId: poi.id,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe("POI already in list");
    });

    it("should return 404 for non-existent list", async () => {
      const res = await request(app)
        .post(`/list/non-existent-id/poi`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          poiId: "non-existent-id",
        });

      expect(res.status).toBe(404);
    });
  });

  describe("GET /list/:listid/pois", () => {
    it("should return POIs in a list", async () => {
      const list = await prisma.poiList.create({
        data: { name: "Test List", createdBy: userId },
      });

      const poi = await prisma.poi.create({
        data: { name: "Test POI", latitude: 0, longitude: 0, createdBy: userId },
      });

      await prisma.savedPoi.create({
        data: { listId: list.id, poiId: poi.id },
      });

      const res = await request(app)
        .get(`/list/${list.id}/pois`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.savedPois).toHaveLength(1);
      expect(res.body.savedPois[0].poi.name).toBe("Test POI");
    });

    it("should return 404 for non-existent list", async () => {
      const res = await request(app)
        .get("/list/non-existent-id/pois")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /list/:listId/poi/:savedPoiId", () => {
    it("should remove a POI from a list", async () => {
      const list = await prisma.poiList.create({
        data: { name: "My List", createdBy: userId },
      });

      const poi = await prisma.poi.create({
        data: {
          name: "Test POI",
          latitude: 48.8566,
          longitude: 2.3522,
          createdBy: userId,
        },
      });

      const savedPoi = await prisma.savedPoi.create({
        data: { listId: list.id, poiId: poi.id },
      });

      const res = await request(app)
        .delete(`/list/${list.id}/poi/${savedPoi.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
    });

    it("should return 404 for non-existent saved POI", async () => {
      const list = await prisma.poiList.create({
        data: { name: "My List", createdBy: userId },
      });

      const res = await request(app)
        .delete(`/list/${list.id}/poi/non-existent-id`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /list/:listId/share", () => {
    it("should generate a share token for list owner", async () => {
      const list = await prisma.poiList.create({
        data: {
          name: "Shareable List",
          createdBy: userId,
        },
      });

      const res = await request(app)
        .post(`/list/${list.id}/share`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("shareLink");
      expect(res.body.shareLink).toContain("/shared/");

      const updatedList = await prisma.poiList.findUnique({
        where: { id: list.id },
      });
      expect(updatedList?.shareToken).toBeTruthy();
      expect(updatedList?.shareTokenExpiresAt).toBeNull();
    });

    it("should reject request from non-owner", async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: "other@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const otherToken = signAccessToken({
        userId: otherUser.id,
        email: otherUser.email,
      });

      const list = await prisma.poiList.create({
        data: {
          name: "Owner's List",
          createdBy: userId,
        },
      });

      const res = await request(app)
        .post(`/list/${list.id}/share`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe(ErrorCodes.LIST_ACCESS_DENIED);
    });

    it("should reject request without authentication", async () => {
      const list = await prisma.poiList.create({
        data: {
          name: "Test List",
          createdBy: userId,
        },
      });

      const res = await request(app).post(`/list/${list.id}/share`);

      expect(res.status).toBe(401);
    });

    it("should return 404 for non-existent list", async () => {
      const res = await request(app)
        .post("/list/non-existent-id/share")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });

    it("should update shareToken if already shared", async () => {
      const list = await prisma.poiList.create({
        data: {
          name: "Already Shared",
          createdBy: userId,
          shareToken: "old-token",
        },
      });

      const res = await request(app)
        .post(`/list/${list.id}/share`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);

      const updatedList = await prisma.poiList.findUnique({
        where: { id: list.id },
      });
      expect(updatedList?.shareToken).not.toBe("old-token");
      expect(updatedList?.shareToken).toBeTruthy();
    });
  });

  describe("DELETE /list/:listId/share", () => {
    it("should revoke share token for list owner", async () => {
      const list = await prisma.poiList.create({
        data: {
          name: "Shared List",
          createdBy: userId,
          shareToken: "test-token",
          shareTokenExpiresAt: null,
        },
      });

      const res = await request(app)
        .delete(`/list/${list.id}/share`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("List unshared successfully");

      const updatedList = await prisma.poiList.findUnique({
        where: { id: list.id },
      });
      expect(updatedList?.shareToken).toBeNull();
      expect(updatedList?.shareTokenExpiresAt).toBeNull();
    });

    it("should reject request from non-owner", async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: "other2@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const otherToken = signAccessToken({
        userId: otherUser.id,
        email: otherUser.email,
      });

      const list = await prisma.poiList.create({
        data: {
          name: "Owner's List",
          createdBy: userId,
          shareToken: "test-token",
        },
      });

      const res = await request(app)
        .delete(`/list/${list.id}/share`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe(ErrorCodes.LIST_ACCESS_DENIED);
    });

    it("should reject request without authentication", async () => {
      const list = await prisma.poiList.create({
        data: {
          name: "Test List",
          createdBy: userId,
          shareToken: "test-token",
        },
      });

      const res = await request(app).delete(`/list/${list.id}/share`);

      expect(res.status).toBe(401);
    });

    it("should return 404 for non-existent list", async () => {
      const res = await request(app)
        .delete("/list/non-existent-id/share")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });

    it("should succeed even if list is not shared", async () => {
      const list = await prisma.poiList.create({
        data: {
          name: "Not Shared",
          createdBy: userId,
          shareToken: null,
        },
      });

      const res = await request(app)
        .delete(`/list/${list.id}/share`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
    });
  });
});
