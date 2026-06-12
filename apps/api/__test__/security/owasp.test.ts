import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

import { createServer } from "../../src/server";
import { prisma } from "../../src/db";
import { hashPassword } from "../../src/auth/hash";
import { signAccessToken } from "../../src/auth/token";
import { ErrorCodes } from "../../src/utils/error-codes";

vi.mock("../../src/upload/service", async () => {
  const actual = await vi.importActual("../../src/upload/service");
  return {
    ...actual,
    uploadFile: vi.fn().mockResolvedValue("https://s3.example.com/test-file.jpg"),
    deleteFile: vi.fn().mockResolvedValue(undefined),
  };
});

const app = createServer();

const SQL_INJECTION_PAYLOAD = "test'; DROP TABLE users; --";
const XSS_PAYLOAD = '<script>alert("xss")</script>';

describe("OWASP Security Tests", () => {
  let userId: string;
  let accessToken: string;
  let attackerToken: string;

  beforeAll(async () => {
    await prisma.listCollaborator.deleteMany();
    await prisma.savedPoi.deleteMany();
    await prisma.poiList.deleteMany();
    await prisma.poi.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: {
        email: "security-owner@example.com",
        passwordHash: await hashPassword("password123"),
        emailVerified: true,
      },
    });

    const attacker = await prisma.user.create({
      data: {
        email: "security-attacker@example.com",
        passwordHash: await hashPassword("password123"),
        emailVerified: true,
      },
    });

    userId = user.id;
    accessToken = signAccessToken({ userId: user.id, email: user.email });
    attackerToken = signAccessToken({ userId: attacker.id, email: attacker.email });
  });

  afterAll(async () => {
    await prisma.listCollaborator.deleteMany();
    await prisma.savedPoi.deleteMany();
    await prisma.poiList.deleteMany();
    await prisma.poi.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.listCollaborator.deleteMany();
    await prisma.savedPoi.deleteMany();
    await prisma.poiList.deleteMany();
    await prisma.poi.deleteMany();
  });

  describe("A03 — Injection", () => {
    it("should reject SQL injection in signup email", async () => {
      const res = await request(app)
        .post("/auth/signup")
        .send({
          email: `${SQL_INJECTION_PAYLOAD}@example.com`,
          password: "password123",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCodes.VALIDATION_ERROR);

      const userCount = await prisma.user.count();
      expect(userCount).toBeGreaterThanOrEqual(2);
    });

    it("should store SQL injection payload as literal list name without DB corruption", async () => {
      const res = await request(app)
        .post("/list")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ name: SQL_INJECTION_PAYLOAD });

      expect(res.status).toBe(201);
      expect(res.body.list.name).toBe(SQL_INJECTION_PAYLOAD);

      const userCount = await prisma.user.count();
      expect(userCount).toBeGreaterThanOrEqual(2);
    });

    it("should reject non-numeric SQL injection in nearby query params", async () => {
      const res = await request(app)
        .get("/poi/nearby")
        .query({ latitude: SQL_INJECTION_PAYLOAD, longitude: "2.3522" })
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCodes.VALIDATION_ERROR);
    });
  });

  describe("A01 — Broken Access Control", () => {
    it("should deny access to another user's private list", async () => {
      const list = await prisma.poiList.create({
        data: { name: "Private List", createdBy: userId, visibility: "PRIVATE" },
      });

      const res = await request(app)
        .get(`/list/${list.id}`)
        .set("Authorization", `Bearer ${attackerToken}`);

      expect(res.status).toBe(404);
    });

    it("should deny deletion of another user's list", async () => {
      const list = await prisma.poiList.create({
        data: { name: "Protected List", createdBy: userId },
      });

      const res = await request(app)
        .delete(`/list/${list.id}`)
        .set("Authorization", `Bearer ${attackerToken}`);

      // No access → 404 (enumeration mitigation); list must remain intact
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe(ErrorCodes.LIST_NOT_FOUND);

      const stillExists = await prisma.poiList.findUnique({ where: { id: list.id } });
      expect(stillExists).not.toBeNull();
    });

    it("should deny reading another user's private POI", async () => {
      const poi = await prisma.poi.create({
        data: {
          name: "Secret POI",
          latitude: 48.8566,
          longitude: 2.3522,
          createdBy: userId,
          visibility: "PRIVATE",
        },
      });

      const res = await request(app)
        .get(`/poi/${poi.id}`)
        .set("Authorization", `Bearer ${attackerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe(ErrorCodes.POI_ACCESS_DENIED);
    });
  });

  describe("A07 — Authentication Failures", () => {
    it("should reject tampered JWT", async () => {
      const tampered = `${accessToken.slice(0, -5)}xxxxx`;

      const res = await request(app).get("/list").set("Authorization", `Bearer ${tampered}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe(ErrorCodes.UNAUTHORIZED);
    });

    it("should reject JWT for a deleted user", async () => {
      const ghost = await prisma.user.create({
        data: {
          email: "ghost@example.com",
          passwordHash: await hashPassword("password123"),
          emailVerified: true,
        },
      });

      const ghostToken = signAccessToken({ userId: ghost.id, email: ghost.email });
      await prisma.user.delete({ where: { id: ghost.id } });

      const res = await request(app).get("/list").set("Authorization", `Bearer ${ghostToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe(ErrorCodes.UNAUTHORIZED);
    });
  });

  describe("Stored XSS payloads", () => {
    it("should persist XSS payload as plain text in list name", async () => {
      const createRes = await request(app)
        .post("/list")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ name: XSS_PAYLOAD });

      expect(createRes.status).toBe(201);
      expect(createRes.body.list.name).toBe(XSS_PAYLOAD);

      const getRes = await request(app)
        .get(`/list/${createRes.body.list.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.list.name).toBe(XSS_PAYLOAD);
    });

    it("should persist XSS payload as plain text in POI description", async () => {
      const res = await request(app)
        .post("/poi")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Test POI",
          description: XSS_PAYLOAD,
          latitude: 48.8566,
          longitude: 2.3522,
        });

      expect(res.status).toBe(201);
      expect(res.body.poi.description).toBe(XSS_PAYLOAD);
    });
  });

  describe("A08 — Unrestricted Upload", () => {
    it("should reject non-image MIME type on upload", async () => {
      const fakeExe = Buffer.from("MZ\x90\x00fake executable content");

      const res = await request(app)
        .post("/upload/avatar")
        .set("Authorization", `Bearer ${accessToken}`)
        .attach("file", fakeExe, {
          filename: "malware.exe",
          contentType: "application/x-msdownload",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("UPLOAD_INVALID_FILE_TYPE");
    });
  });
});
