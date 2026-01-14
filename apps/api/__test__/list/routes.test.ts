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
    await prisma.listCollaborator.deleteMany();
    await prisma.savedPoi.deleteMany();
    await prisma.poiList.deleteMany();
    await prisma.googlePlaceCache.deleteMany();
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
    await prisma.listCollaborator.deleteMany();
    await prisma.savedPoi.deleteMany();
    await prisma.poiList.deleteMany();
    await prisma.googlePlaceCache.deleteMany();
    await prisma.poi.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  beforeEach(async () => {
    await prisma.listCollaborator.deleteMany();
    await prisma.savedPoi.deleteMany();
    await prisma.poiList.deleteMany();
    await prisma.googlePlaceCache.deleteMany();
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

      // Returns 404 to not reveal list existence to non-authorized users
      expect(res.status).toBe(404);
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

      // Returns 404 to not reveal list existence to non-authorized users
      expect(res.status).toBe(404);
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

  describe("GET /list with roles filter", () => {
    it("should return lists with role field", async () => {
      await prisma.poiList.create({
        data: { name: "My List", createdBy: userId },
      });

      const res = await request(app).get("/list").set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.lists[0]).toHaveProperty("role", "OWNER");
    });

    it("should include lists where user is collaborator", async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: "other-collab@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const otherList = await prisma.poiList.create({
        data: { name: "Other's List", createdBy: otherUser.id },
      });

      await prisma.listCollaborator.create({
        data: { listId: otherList.id, userId, role: "EDITOR" },
      });

      const res = await request(app).get("/list").set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      const collabList = res.body.lists.find((l: { id: string }) => l.id === otherList.id);
      expect(collabList).toBeDefined();
      expect(collabList.role).toBe("EDITOR");
    });

    it("should filter by OWNER role only", async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: "other-filter@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      await prisma.poiList.create({
        data: { name: "My List", createdBy: userId },
      });

      const otherList = await prisma.poiList.create({
        data: { name: "Other's List", createdBy: otherUser.id },
      });

      await prisma.listCollaborator.create({
        data: { listId: otherList.id, userId, role: "EDITOR" },
      });

      const res = await request(app)
        .get("/list?roles=OWNER")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.lists).toHaveLength(1);
      expect(res.body.lists[0].role).toBe("OWNER");
    });

    it("should filter by EDITOR role only", async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: "other-editor@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      await prisma.poiList.create({
        data: { name: "My List", createdBy: userId },
      });

      const otherList = await prisma.poiList.create({
        data: { name: "Other's List", createdBy: otherUser.id },
      });

      await prisma.listCollaborator.create({
        data: { listId: otherList.id, userId, role: "EDITOR" },
      });

      const res = await request(app)
        .get("/list?roles=EDITOR")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.lists).toHaveLength(1);
      expect(res.body.lists[0].role).toBe("EDITOR");
    });

    it("should filter by multiple roles", async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: "other-multi@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      await prisma.poiList.create({
        data: { name: "My List", createdBy: userId },
      });

      const otherList = await prisma.poiList.create({
        data: { name: "Other's List", createdBy: otherUser.id },
      });

      await prisma.listCollaborator.create({
        data: { listId: otherList.id, userId, role: "EDITOR" },
      });

      const res = await request(app)
        .get("/list?roles=OWNER,EDITOR")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.lists).toHaveLength(2);
    });
  });

  describe("POST /list/:listId/edit-link", () => {
    it("should generate an edit link for owner", async () => {
      const list = await prisma.poiList.create({
        data: { name: "My List", createdBy: userId },
      });

      const res = await request(app)
        .post(`/list/${list.id}/edit-link`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("editLink");
      expect(res.body.editLink).toContain("/join?editToken=");

      const updatedList = await prisma.poiList.findUnique({ where: { id: list.id } });
      expect(updatedList?.editToken).toBeTruthy();
    });

    it("should reject non-owner", async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: "other-editlink@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const otherToken = signAccessToken({ userId: otherUser.id, email: otherUser.email });

      const list = await prisma.poiList.create({
        data: { name: "My List", createdBy: userId },
      });

      const res = await request(app)
        .post(`/list/${list.id}/edit-link`)
        .set("Authorization", `Bearer ${otherToken}`);

      // Returns 404 to not reveal list existence to non-authorized users
      expect(res.status).toBe(404);
    });

    it("should return 404 for non-existent list", async () => {
      const res = await request(app)
        .post("/list/non-existent-id/edit-link")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });

    it("should regenerate edit token if already exists", async () => {
      const list = await prisma.poiList.create({
        data: { name: "My List", createdBy: userId, editToken: "old-token" },
      });

      const res = await request(app)
        .post(`/list/${list.id}/edit-link`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);

      const updatedList = await prisma.poiList.findUnique({ where: { id: list.id } });
      expect(updatedList?.editToken).not.toBe("old-token");
    });
  });

  describe("DELETE /list/:listId/edit-link", () => {
    it("should revoke edit link for owner", async () => {
      const list = await prisma.poiList.create({
        data: { name: "My List", createdBy: userId, editToken: "test-token" },
      });

      const res = await request(app)
        .delete(`/list/${list.id}/edit-link`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Edit link revoked successfully");

      const updatedList = await prisma.poiList.findUnique({ where: { id: list.id } });
      expect(updatedList?.editToken).toBeNull();
    });

    it("should reject non-owner", async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: "other-revoke@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const otherToken = signAccessToken({ userId: otherUser.id, email: otherUser.email });

      const list = await prisma.poiList.create({
        data: { name: "My List", createdBy: userId, editToken: "test-token" },
      });

      const res = await request(app)
        .delete(`/list/${list.id}/edit-link`)
        .set("Authorization", `Bearer ${otherToken}`);

      // Returns 404 to not reveal list existence to non-authorized users
      expect(res.status).toBe(404);
    });

    it("should return 404 for non-existent list", async () => {
      const res = await request(app)
        .delete("/list/non-existent-id/edit-link")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /list/join", () => {
    it("should join a list with valid edit token", async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: "owner-join@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const list = await prisma.poiList.create({
        data: { name: "Joinable List", createdBy: otherUser.id, editToken: "valid-token" },
      });

      const res = await request(app)
        .post("/list/join?editToken=valid-token")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);

      const collaborator = await prisma.listCollaborator.findUnique({
        where: { listId_userId: { listId: list.id, userId } },
      });
      expect(collaborator).toBeDefined();
      expect(collaborator?.role).toBe("EDITOR");
    });

    it("should return 400 if no edit token provided", async () => {
      const res = await request(app)
        .post("/list/join")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCodes.TOKEN_REQUIRED);
    });

    it("should return 404 for invalid edit token", async () => {
      const res = await request(app)
        .post("/list/join?editToken=invalid-token")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 400 for expired edit token", async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: "owner-expired@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      await prisma.poiList.create({
        data: {
          name: "Expired List",
          createdBy: otherUser.id,
          editToken: "expired-token",
          editTokenExpiresAt: new Date(Date.now() - 1000),
        },
      });

      const res = await request(app)
        .post("/list/join?editToken=expired-token")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCodes.LIST_EDIT_TOKEN_EXPIRED);
    });

    it("should return message if user is owner", async () => {
      const list = await prisma.poiList.create({
        data: { name: "My List", createdBy: userId, editToken: "my-token" },
      });

      const res = await request(app)
        .post("/list/join?editToken=my-token")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("You are the owner of this list.");
    });

    it("should return message if already a collaborator", async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: "owner-already@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const list = await prisma.poiList.create({
        data: { name: "Already Joined", createdBy: otherUser.id, editToken: "already-token" },
      });

      await prisma.listCollaborator.create({
        data: { listId: list.id, userId, role: "EDITOR" },
      });

      const res = await request(app)
        .post("/list/join?editToken=already-token")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("You are already a collaborator of this list.");
    });
  });

  describe("GET /list/:listId/collaborators", () => {
    it("should return collaborators for owner", async () => {
      const list = await prisma.poiList.create({
        data: { name: "My List", createdBy: userId },
      });

      const collaborator = await prisma.user.create({
        data: {
          email: "collab@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
          name: "Collaborator",
        },
      });

      await prisma.listCollaborator.create({
        data: { listId: list.id, userId: collaborator.id, role: "EDITOR" },
      });

      const res = await request(app)
        .get(`/list/${list.id}/collaborators`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.collaborators).toHaveLength(1);
      expect(res.body.collaborators[0].user.email).toBe("collab@example.com");
      expect(res.body.collaborators[0].role).toBe("EDITOR");
    });

    it("should return collaborators for collaborator", async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: "owner-collabs@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const list = await prisma.poiList.create({
        data: { name: "Other's List", createdBy: otherUser.id },
      });

      await prisma.listCollaborator.create({
        data: { listId: list.id, userId, role: "EDITOR" },
      });

      const res = await request(app)
        .get(`/list/${list.id}/collaborators`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.collaborators).toHaveLength(1);
    });

    it("should return 404 for non-collaborator on private list", async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: "owner-private@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const list = await prisma.poiList.create({
        data: { name: "Private List", createdBy: otherUser.id, visibility: "PRIVATE" },
      });

      const res = await request(app)
        .get(`/list/${list.id}/collaborators`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 404 for non-existent list", async () => {
      const res = await request(app)
        .get("/list/non-existent-id/collaborators")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /list/:listId/collaborators/me", () => {
    it("should allow collaborator to leave a list", async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: "owner-leave@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const list = await prisma.poiList.create({
        data: { name: "Leavable List", createdBy: otherUser.id },
      });

      await prisma.listCollaborator.create({
        data: { listId: list.id, userId, role: "EDITOR" },
      });

      const res = await request(app)
        .delete(`/list/${list.id}/collaborators/me`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("You have left the list");

      const collaborator = await prisma.listCollaborator.findUnique({
        where: { listId_userId: { listId: list.id, userId } },
      });
      expect(collaborator).toBeNull();
    });

    it("should prevent owner from leaving their own list", async () => {
      const list = await prisma.poiList.create({
        data: { name: "My List", createdBy: userId },
      });

      const res = await request(app)
        .delete(`/list/${list.id}/collaborators/me`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCodes.LIST_OWNER_CANNOT_LEAVE);
    });

    it("should return 404 for non-existent list", async () => {
      const res = await request(app)
        .delete("/list/non-existent-id/collaborators/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /list/:listId/collaborators/:collaboratorId", () => {
    it("should allow owner to remove a collaborator", async () => {
      const list = await prisma.poiList.create({
        data: { name: "My List", createdBy: userId },
      });

      const collaborator = await prisma.user.create({
        data: {
          email: "to-remove@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      await prisma.listCollaborator.create({
        data: { listId: list.id, userId: collaborator.id, role: "EDITOR" },
      });

      const res = await request(app)
        .delete(`/list/${list.id}/collaborators/${collaborator.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Collaborator removed successfully");

      const collab = await prisma.listCollaborator.findUnique({
        where: { listId_userId: { listId: list.id, userId: collaborator.id } },
      });
      expect(collab).toBeNull();
    });

    it("should reject non-owner/non-admin from removing collaborators", async () => {
      const owner = await prisma.user.create({
        data: {
          email: "owner-remove@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const list = await prisma.poiList.create({
        data: { name: "Owner's List", createdBy: owner.id },
      });

      const otherCollab = await prisma.user.create({
        data: {
          email: "other-collab-remove@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      await prisma.listCollaborator.create({
        data: { listId: list.id, userId, role: "EDITOR" },
      });

      await prisma.listCollaborator.create({
        data: { listId: list.id, userId: otherCollab.id, role: "EDITOR" },
      });

      const res = await request(app)
        .delete(`/list/${list.id}/collaborators/${otherCollab.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe(ErrorCodes.LIST_ACCESS_DENIED);
    });

    it("should return 404 for non-existent list", async () => {
      const res = await request(app)
        .delete("/list/non-existent-id/collaborators/some-user-id")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("Collaborator access to lists", () => {
    it("should allow collaborator to view a private list", async () => {
      const owner = await prisma.user.create({
        data: {
          email: "owner-view@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const list = await prisma.poiList.create({
        data: { name: "Private List", createdBy: owner.id, visibility: "PRIVATE" },
      });

      await prisma.listCollaborator.create({
        data: { listId: list.id, userId, role: "VIEWER" },
      });

      const res = await request(app)
        .get(`/list/${list.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.list.name).toBe("Private List");
    });

    it("should allow collaborator EDITOR to update a list", async () => {
      const owner = await prisma.user.create({
        data: {
          email: "owner-update@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const list = await prisma.poiList.create({
        data: { name: "Editable List", createdBy: owner.id },
      });

      await prisma.listCollaborator.create({
        data: { listId: list.id, userId, role: "EDITOR" },
      });

      const res = await request(app)
        .put(`/list/${list.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ name: "Updated Name" });

      expect(res.status).toBe(200);
      expect(res.body.list.name).toBe("Updated Name");
    });

    it("should reject VIEWER from updating a list", async () => {
      const owner = await prisma.user.create({
        data: {
          email: "owner-viewer@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const list = await prisma.poiList.create({
        data: { name: "View Only List", createdBy: owner.id },
      });

      await prisma.listCollaborator.create({
        data: { listId: list.id, userId, role: "VIEWER" },
      });

      const res = await request(app)
        .put(`/list/${list.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ name: "Updated Name" });

      expect(res.status).toBe(403);
    });

    it("should reject collaborator from deleting a list", async () => {
      const owner = await prisma.user.create({
        data: {
          email: "owner-delete@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const list = await prisma.poiList.create({
        data: { name: "Cannot Delete", createdBy: owner.id },
      });

      await prisma.listCollaborator.create({
        data: { listId: list.id, userId, role: "EDITOR" },
      });

      const res = await request(app)
        .delete(`/list/${list.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(403);
    });

    it("should allow anyone to view a PUBLIC list", async () => {
      const owner = await prisma.user.create({
        data: {
          email: "owner-public@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const list = await prisma.poiList.create({
        data: { name: "Public List", createdBy: owner.id, visibility: "PUBLIC" },
      });

      const res = await request(app)
        .get(`/list/${list.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.list.name).toBe("Public List");
    });
  });

  describe("POST /list/:listId/collaborators/invite", () => {
    it("should generate an invitation link for owner", async () => {
      const list = await prisma.poiList.create({
        data: { name: "My List", createdBy: userId },
      });

      const res = await request(app)
        .post(`/list/${list.id}/collaborators/invite`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          email: "invited@example.com",
          role: "EDITOR",
          sendEmail: false,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("inviteLink");
      expect(res.body.inviteLink).toContain("/collaborators/accept?token=");
      expect(res.body.emailSent).toBe(false);
    });

    it("should default to VIEWER role if not specified", async () => {
      const list = await prisma.poiList.create({
        data: { name: "My List", createdBy: userId },
      });

      const res = await request(app)
        .post(`/list/${list.id}/collaborators/invite`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          email: "viewer@example.com",
          sendEmail: false,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("inviteLink");
    });

    it("should reject invitation to self", async () => {
      const list = await prisma.poiList.create({
        data: { name: "My List", createdBy: userId },
      });

      const user = await prisma.user.findUnique({ where: { id: userId } });

      const res = await request(app)
        .post(`/list/${list.id}/collaborators/invite`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          email: user!.email,
          role: "EDITOR",
          sendEmail: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCodes.COLLABORATOR_CANNOT_INVITE_YOURSELF);
    });

    it("should reject if user is already a collaborator", async () => {
      const list = await prisma.poiList.create({
        data: { name: "My List", createdBy: userId },
      });

      const collaborator = await prisma.user.create({
        data: {
          email: "existing@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      await prisma.listCollaborator.create({
        data: { listId: list.id, userId: collaborator.id, role: "EDITOR" },
      });

      const res = await request(app)
        .post(`/list/${list.id}/collaborators/invite`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          email: "existing@example.com",
          role: "EDITOR",
          sendEmail: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCodes.COLLABORATOR_ALREADY_EXISTS);
    });

    it("should allow inviting a user without an account", async () => {
      const list = await prisma.poiList.create({
        data: { name: "My List", createdBy: userId },
      });

      const res = await request(app)
        .post(`/list/${list.id}/collaborators/invite`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          email: "new-user@example.com",
          role: "EDITOR",
          sendEmail: false,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("inviteLink");
      expect(res.body.emailSent).toBe(false);
    });

    it("should reject non-owner/non-admin from inviting", async () => {
      const owner = await prisma.user.create({
        data: {
          email: "owner-invite@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const list = await prisma.poiList.create({
        data: { name: "Owner's List", createdBy: owner.id },
      });

      await prisma.listCollaborator.create({
        data: { listId: list.id, userId, role: "EDITOR" },
      });

      const res = await request(app)
        .post(`/list/${list.id}/collaborators/invite`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          email: "newuser@example.com",
          role: "EDITOR",
          sendEmail: false,
        });

      expect(res.status).toBe(403);
    });

    it("should return 404 for non-existent list", async () => {
      const res = await request(app)
        .post("/list/non-existent-id/collaborators/invite")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          email: "someone@example.com",
          role: "EDITOR",
        });

      expect(res.status).toBe(404);
    });

    it("should reject invalid email format", async () => {
      const list = await prisma.poiList.create({
        data: { name: "My List", createdBy: userId },
      });

      const res = await request(app)
        .post(`/list/${list.id}/collaborators/invite`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          email: "invalid-email",
          role: "EDITOR",
        });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /list/:listId/collaborators/join", () => {
    it("should join a list with valid invitation token", async () => {
      const owner = await prisma.user.create({
        data: {
          email: "owner-join-invite@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const invitee = await prisma.user.create({
        data: {
          email: "invitee@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const inviteeToken = signAccessToken({ userId: invitee.id, email: invitee.email });

      const list = await prisma.poiList.create({
        data: { name: "Invitation List", createdBy: owner.id },
      });

      // Simulate invitation token
      const jwt = await import("jsonwebtoken");
      const invitationToken = jwt.sign(
        {
          listId: list.id,
          email: invitee.email,
          role: "EDITOR",
          invitedBy: owner.id,
          type: "collaborator_invite",
        },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      const res = await request(app)
        .post(`/list/${list.id}/collaborators/join?token=${invitationToken}`)
        .set("Authorization", `Bearer ${inviteeToken}`);

      expect(res.status).toBe(200);

      const collaborator = await prisma.listCollaborator.findUnique({
        where: { listId_userId: { listId: list.id, userId: invitee.id } },
      });
      expect(collaborator).toBeDefined();
      expect(collaborator?.role).toBe("EDITOR");
    });

    it("should reject invalid token", async () => {
      const owner = await prisma.user.create({
        data: {
          email: "owner-invalid@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const list = await prisma.poiList.create({
        data: { name: "List", createdBy: owner.id },
      });

      const res = await request(app)
        .post(`/list/${list.id}/collaborators/join?token=invalid-token`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCodes.SHARE_TOKEN_INVALID);
    });

    it("should reject expired token", async () => {
      const owner = await prisma.user.create({
        data: {
          email: "owner-expired-invite@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const invitee = await prisma.user.create({
        data: {
          email: "invitee-expired@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const inviteeToken = signAccessToken({ userId: invitee.id, email: invitee.email });

      const list = await prisma.poiList.create({
        data: { name: "Expired Invitation", createdBy: owner.id },
      });

      const jwt = await import("jsonwebtoken");
      const expiredToken = jwt.sign(
        {
          listId: list.id,
          email: invitee.email,
          role: "EDITOR",
          invitedBy: owner.id,
          type: "collaborator_invite",
        },
        process.env.JWT_SECRET!,
        { expiresIn: "-1s" } // Already expired
      );

      const res = await request(app)
        .post(`/list/${list.id}/collaborators/join?token=${expiredToken}`)
        .set("Authorization", `Bearer ${inviteeToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCodes.SHARE_TOKEN_INVALID);
    });

    it("should reject if email doesn't match logged in user", async () => {
      const owner = await prisma.user.create({
        data: {
          email: "owner-mismatch@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const list = await prisma.poiList.create({
        data: { name: "List", createdBy: owner.id },
      });

      const jwt = await import("jsonwebtoken");
      const invitationToken = jwt.sign(
        {
          listId: list.id,
          email: "other@example.com", // Different email
          role: "EDITOR",
          invitedBy: owner.id,
          type: "collaborator_invite",
        },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      const res = await request(app)
        .post(`/list/${list.id}/collaborators/join?token=${invitationToken}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCodes.SHARE_TOKEN_INVALID);
    });

    it("should reject if listId doesn't match", async () => {
      const owner = await prisma.user.create({
        data: {
          email: "owner-listmismatch@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const list1 = await prisma.poiList.create({
        data: { name: "List 1", createdBy: owner.id },
      });

      const list2 = await prisma.poiList.create({
        data: { name: "List 2", createdBy: owner.id },
      });

      const invitee = await prisma.user.create({
        data: {
          email: "invitee-mismatch@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const inviteeToken = signAccessToken({ userId: invitee.id, email: invitee.email });

      const jwt = await import("jsonwebtoken");
      const invitationToken = jwt.sign(
        {
          listId: list1.id, // Token for list1
          email: invitee.email,
          role: "EDITOR",
          invitedBy: owner.id,
          type: "collaborator_invite",
        },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      // Try to join list2 with list1's token
      const res = await request(app)
        .post(`/list/${list2.id}/collaborators/join?token=${invitationToken}`)
        .set("Authorization", `Bearer ${inviteeToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCodes.SHARE_TOKEN_INVALID);
    });

    it("should reject if token type is not collaborator_invite", async () => {
      const owner = await prisma.user.create({
        data: {
          email: "owner-wrongtype@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const invitee = await prisma.user.create({
        data: {
          email: "invitee-wrongtype@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const inviteeToken = signAccessToken({ userId: invitee.id, email: invitee.email });

      const list = await prisma.poiList.create({
        data: { name: "List", createdBy: owner.id },
      });

      const jwt = await import("jsonwebtoken");
      const wrongToken = jwt.sign(
        {
          listId: list.id,
          email: invitee.email,
          role: "EDITOR",
          invitedBy: owner.id,
          type: "wrong_type", // Wrong type
        },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      const res = await request(app)
        .post(`/list/${list.id}/collaborators/join?token=${wrongToken}`)
        .set("Authorization", `Bearer ${inviteeToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCodes.SHARE_TOKEN_INVALID);
    });

    it("should reject if owner tries to join their own list", async () => {
      const list = await prisma.poiList.create({
        data: { name: "My List", createdBy: userId },
      });

      const user = await prisma.user.findUnique({ where: { id: userId } });

      const jwt = await import("jsonwebtoken");
      const invitationToken = jwt.sign(
        {
          listId: list.id,
          email: user!.email,
          role: "EDITOR",
          invitedBy: "someone-else",
          type: "collaborator_invite",
        },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      const res = await request(app)
        .post(`/list/${list.id}/collaborators/join?token=${invitationToken}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCodes.COLLABORATOR_OWNER_CANNOT_JOIN);
    });

    it("should reject if already a collaborator", async () => {
      const owner = await prisma.user.create({
        data: {
          email: "owner-already-collab@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const invitee = await prisma.user.create({
        data: {
          email: "invitee-already-collab@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const inviteeToken = signAccessToken({ userId: invitee.id, email: invitee.email });

      const list = await prisma.poiList.create({
        data: { name: "List", createdBy: owner.id },
      });

      // Already a collaborator
      await prisma.listCollaborator.create({
        data: { listId: list.id, userId: invitee.id, role: "VIEWER" },
      });

      const jwt = await import("jsonwebtoken");
      const invitationToken = jwt.sign(
        {
          listId: list.id,
          email: invitee.email,
          role: "EDITOR",
          invitedBy: owner.id,
          type: "collaborator_invite",
        },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      const res = await request(app)
        .post(`/list/${list.id}/collaborators/join?token=${invitationToken}`)
        .set("Authorization", `Bearer ${inviteeToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCodes.COLLABORATOR_ALREADY_EXISTS);
    });

    it("should return 400 if token is missing", async () => {
      const list = await prisma.poiList.create({
        data: { name: "My List", createdBy: userId },
      });

      const res = await request(app)
        .post(`/list/${list.id}/collaborators/join`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCodes.TOKEN_REQUIRED);
    });

    it("should return 404 for non-existent list", async () => {
      const invitee = await prisma.user.create({
        data: {
          email: "invitee-404@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const inviteeToken = signAccessToken({ userId: invitee.id, email: invitee.email });

      const jwt = await import("jsonwebtoken");
      const invitationToken = jwt.sign(
        {
          listId: "non-existent-id",
          email: invitee.email,
          role: "EDITOR",
          invitedBy: userId,
          type: "collaborator_invite",
        },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      const res = await request(app)
        .post("/list/non-existent-id/collaborators/join?token=" + invitationToken)
        .set("Authorization", `Bearer ${inviteeToken}`);

      expect(res.status).toBe(404);
    });

    it("should assign correct role from token", async () => {
      const owner = await prisma.user.create({
        data: {
          email: "owner-role@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const invitee = await prisma.user.create({
        data: {
          email: "invitee-role@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const inviteeToken = signAccessToken({ userId: invitee.id, email: invitee.email });

      const list = await prisma.poiList.create({
        data: { name: "Role Test List", createdBy: owner.id },
      });

      const jwt = await import("jsonwebtoken");
      const invitationToken = jwt.sign(
        {
          listId: list.id,
          email: invitee.email,
          role: "ADMIN",
          invitedBy: owner.id,
          type: "collaborator_invite",
        },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      const res = await request(app)
        .post(`/list/${list.id}/collaborators/join?token=${invitationToken}`)
        .set("Authorization", `Bearer ${inviteeToken}`);

      expect(res.status).toBe(200);

      const collaborator = await prisma.listCollaborator.findUnique({
        where: { listId_userId: { listId: list.id, userId: invitee.id } },
      });
      expect(collaborator?.role).toBe("ADMIN");
    });
  });

  describe("GET /list/:listId/poi/nearby", () => {
    it("should return nearby POIs from a list", async () => {
      const list = await prisma.poiList.create({
        data: { name: "My List", createdBy: userId },
      });

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
          latitude: 51.5074, // London
          longitude: -0.1278,
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
        .get(`/list/${list.id}/poi/nearby`)
        .set("Authorization", `Bearer ${accessToken}`)
        .query({ latitude: 48.8566, longitude: 2.3522, radius: 1000 });

      expect(res.status).toBe(200);
      expect(res.body.pois).toHaveLength(1);
      expect(res.body.pois[0].name).toBe("Nearby POI");
      expect(res.body.pois[0].distance).toBeDefined();
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
        .get(`/list/${list.id}/poi/nearby`)
        .set("Authorization", `Bearer ${accessToken}`)
        .query({ latitude: 48.8566, longitude: 2.3522, radius: 5000 });

      expect(res.status).toBe(200);
      expect(res.body.pois).toHaveLength(2);
      expect(res.body.pois[0].name).toBe("POI 100m away");
      expect(res.body.pois[1].name).toBe("POI 500m away");
    });

    it("should allow collaborator to access nearby POIs", async () => {
      const owner = await prisma.user.create({
        data: {
          email: "owner-nearby@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const list = await prisma.poiList.create({
        data: { name: "Owner List", createdBy: owner.id },
      });

      // Add current user as collaborator
      await prisma.listCollaborator.create({
        data: { listId: list.id, userId: userId, role: "VIEWER" },
      });

      const poi = await prisma.poi.create({
        data: {
          name: "Nearby POI",
          latitude: 48.8566,
          longitude: 2.3522,
          createdBy: owner.id,
        },
      });

      await prisma.savedPoi.create({
        data: { listId: list.id, poiId: poi.id },
      });

      const res = await request(app)
        .get(`/list/${list.id}/poi/nearby`)
        .set("Authorization", `Bearer ${accessToken}`)
        .query({ latitude: 48.8566, longitude: 2.3522, radius: 1000 });

      expect(res.status).toBe(200);
      expect(res.body.pois).toHaveLength(1);
    });

    it("should deny access to non-collaborator", async () => {
      const owner = await prisma.user.create({
        data: {
          email: "stranger-nearby@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const privateList = await prisma.poiList.create({
        data: { name: "Private List", createdBy: owner.id, visibility: "PRIVATE" },
      });

      const res = await request(app)
        .get(`/list/${privateList.id}/poi/nearby`)
        .set("Authorization", `Bearer ${accessToken}`)
        .query({ latitude: 48.8566, longitude: 2.3522, radius: 1000 });

      expect(res.status).toBe(404);
    });

    it("should return 404 for non-existent list", async () => {
      const res = await request(app)
        .get("/list/non-existent-id/poi/nearby")
        .set("Authorization", `Bearer ${accessToken}`)
        .query({ latitude: 48.8566, longitude: 2.3522, radius: 1000 });

      expect(res.status).toBe(404);
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
        .get(`/list/${list.id}/poi/nearby`)
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
        .get(`/list/${list.id}/poi/nearby`)
        .set("Authorization", `Bearer ${accessToken}`)
        .query({ latitude: 48.8566, longitude: 2.3522 }); // No radius

      expect(res.status).toBe(200);
      expect(res.body.pois).toHaveLength(1);
    });

    it("should fail without authentication", async () => {
      const list = await prisma.poiList.create({
        data: { name: "My List", createdBy: userId },
      });

      const res = await request(app)
        .get(`/list/${list.id}/poi/nearby`)
        .query({ latitude: 48.8566, longitude: 2.3522, radius: 1000 });

      expect(res.status).toBe(401);
    });

    it("should fail with invalid latitude", async () => {
      const list = await prisma.poiList.create({
        data: { name: "My List", createdBy: userId },
      });

      const res = await request(app)
        .get(`/list/${list.id}/poi/nearby`)
        .set("Authorization", `Bearer ${accessToken}`)
        .query({ latitude: 100, longitude: 2.3522, radius: 1000 });

      expect(res.status).toBe(400);
    });

    it("should fail with invalid longitude", async () => {
      const list = await prisma.poiList.create({
        data: { name: "My List", createdBy: userId },
      });

      const res = await request(app)
        .get(`/list/${list.id}/poi/nearby`)
        .set("Authorization", `Bearer ${accessToken}`)
        .query({ latitude: 48.8566, longitude: 200, radius: 1000 });

      expect(res.status).toBe(400);
    });

    it("should fail with radius exceeding maximum", async () => {
      const list = await prisma.poiList.create({
        data: { name: "My List", createdBy: userId },
      });

      const res = await request(app)
        .get(`/list/${list.id}/poi/nearby`)
        .set("Authorization", `Bearer ${accessToken}`)
        .query({ latitude: 48.8566, longitude: 2.3522, radius: 100000 });

      expect(res.status).toBe(400);
    });

    it("should include Google Places in nearby results", async () => {
      const list = await prisma.poiList.create({
        data: { name: "My List", createdBy: userId },
      });

      // Create a Google Place cache entry
      const googlePlace = await prisma.googlePlaceCache.create({
        data: {
          placeId: "ChIJD7fiBh9u5kcRYJSMaMOCCwQ",
          name: "Google Place",
          latitude: 48.8566,
          longitude: 2.3522,
        },
      });

      await prisma.savedPoi.create({
        data: { listId: list.id, googlePlaceId: googlePlace.placeId },
      });

      const res = await request(app)
        .get(`/list/${list.id}/poi/nearby`)
        .set("Authorization", `Bearer ${accessToken}`)
        .query({ latitude: 48.8566, longitude: 2.3522, radius: 1000 });

      expect(res.status).toBe(200);
      expect(res.body.pois).toHaveLength(1);
      expect(res.body.pois[0].name).toBe("Google Place");
      expect(res.body.pois[0].googlePlaceId).toBe("ChIJD7fiBh9u5kcRYJSMaMOCCwQ");
    });

    it("should return both custom POIs and Google Places", async () => {
      const list = await prisma.poiList.create({
        data: { name: "My List", createdBy: userId },
      });

      const poi = await prisma.poi.create({
        data: {
          name: "Custom POI",
          latitude: 48.8566,
          longitude: 2.3522,
          createdBy: userId,
        },
      });

      const googlePlace = await prisma.googlePlaceCache.create({
        data: {
          placeId: "ChIJD7fiBh9u5kcRYJSMaMOCCwR",
          name: "Google Place",
          latitude: 48.857,
          longitude: 2.3522,
        },
      });

      await prisma.savedPoi.createMany({
        data: [
          { listId: list.id, poiId: poi.id },
          { listId: list.id, googlePlaceId: googlePlace.placeId },
        ],
      });

      const res = await request(app)
        .get(`/list/${list.id}/poi/nearby`)
        .set("Authorization", `Bearer ${accessToken}`)
        .query({ latitude: 48.8566, longitude: 2.3522, radius: 1000 });

      expect(res.status).toBe(200);
      expect(res.body.pois).toHaveLength(2);
    });
  });
});
