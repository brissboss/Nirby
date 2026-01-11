import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";

import { createServer } from "../../src/server";
import { prisma } from "../../src/db";
import { hashPassword } from "../../src/auth/hash";
import { signAccessToken } from "../../src/auth/token";

const app = createServer();

describe("List Routes", () => {
  let userId: string;
  let accessToken: string;

  beforeAll(async () => {
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
    await prisma.poiList.deleteMany();
    await prisma.poi.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  beforeEach(async () => {
    await prisma.poiList.deleteMany();
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
});
