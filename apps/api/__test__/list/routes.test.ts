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
    await prisma.poi.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  beforeEach(async () => {
    await prisma.listCollaborator.deleteMany();
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
      expect(res.body.message).toBe(
        "You are now a collaborator of this list. You can now edit the list."
      );

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
});
