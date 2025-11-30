import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import express, { Request, Response } from "express";
import { requireAuth } from "../../src/auth/middleware";
import { prisma } from "../../src/db";
import { signAccessToken } from "../../src/auth/token";
import { ErrorCodes } from "../../src/utils/error-codes";
import { requireVerifiedEmail } from "../../src/auth/middleware";

function createTestApp() {
  const app = express();
  app.use(express.json());

  app.get("/protected", requireAuth, (req: Request, res: Response) => {
    res.json({
      success: true,
      user: req.user,
    });
  });

  return app;
}

function createVerifiedTestApp() {
  const app = express();
  app.use(express.json());

  app.get(
    "/verified-protected",
    requireAuth,
    requireVerifiedEmail,
    (req: Request, res: Response) => {
      res.json({
        success: true,
        user: req.user,
      });
    }
  );

  return app;
}

describe("requireAuth middleware", () => {
  const app = createTestApp();

  beforeAll(async () => {
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  describe("Valid authentication", () => {
    it("should allow access with valid token and existing user", async () => {
      const user = await prisma.user.create({
        data: {
          email: "test@example.com",
          passwordHash: "dummy-hash",
        },
      });

      const token = signAccessToken({ userId: user.id, email: user.email });

      const res = await request(app).get("/protected").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.id).toBe(user.id);
      expect(res.body.user.email).toBe(user.email);
    });
  });

  describe("Missing authorization header", () => {
    it("should reject request without Authorization header", async () => {
      const res = await request(app).get("/protected");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe(ErrorCodes.UNAUTHORIZED);
      expect(res.body.error.message).toContain("authorization header");
    });
  });

  describe("Invalid authorization header", () => {
    it("should reject request with malformed Authorization header", async () => {
      const res = await request(app)
        .get("/protected")
        .set("Authorization", "InvalidFormat token123");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe(ErrorCodes.UNAUTHORIZED);
    });
  });

  describe("Invalid token", () => {
    it("should reject request with invalid token", async () => {
      const res = await request(app)
        .get("/protected")
        .set("Authorization", "Bearer invalid-token-123");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe(ErrorCodes.UNAUTHORIZED);
      expect(res.body.error.message).toContain("Invalid or expired token");
    });
  });

  describe("User not found", () => {
    it("should reject request when user does not exist in database", async () => {
      const user = await prisma.user.create({
        data: {
          email: "test@example.com",
          passwordHash: "dummy-hash",
        },
      });

      const token = signAccessToken({ userId: user.id, email: user.email });

      await prisma.user.delete({
        where: { id: user.id },
      });

      const res = await request(app).get("/protected").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe(ErrorCodes.UNAUTHORIZED);
      expect(res.body.error.message).toContain("User not found");
    });
  });

  //   Security tests
  describe("Security", () => {
    it("should reject tampered token", async () => {
      const user = await prisma.user.create({
        data: {
          email: "security@example.com",
          passwordHash: "dummy-hash",
        },
      });

      const validToken = signAccessToken({ userId: user.id, email: user.email });
      const tamperedToken = validToken.slice(0, -5) + "xxxxx";

      const res = await request(app)
        .get("/protected")
        .set("Authorization", `Bearer ${tamperedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe(ErrorCodes.UNAUTHORIZED);
      expect(res.body.error.message).toContain("Invalid or expired token");
    });

    it("should reject tokens with non-existent user ID", async () => {
      const fakeUserId = "fake-user-id-that-does-not-exist";
      const fakeEmail = "fake@example.com";

      const token = signAccessToken({ userId: fakeUserId, email: fakeEmail });

      const res = await request(app).get("/protected").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe(ErrorCodes.UNAUTHORIZED);
      expect(res.body.error.message).toContain("User not found");
    });
  });
  
  describe("requireVerifiedEmail middleware", () => {
    const app = createVerifiedTestApp();

    beforeEach(async () => {
      await prisma.session.deleteMany();
      await prisma.user.deleteMany();
    });

    describe("Valid authentication and verification", () => {
      it("should allow access with valid token and verified email", async () => {
        const user = await prisma.user.create({
          data: {
            email: "verified@example.com",
            passwordHash: "dummy-hash",
            emailVerified: true,
          },
        });

        const token = signAccessToken({ userId: user.id, email: user.email });

        const res = await request(app)
          .get("/verified-protected")
          .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user.id).toBe(user.id);
        expect(res.body.user.email).toBe(user.email);
      });
    });

    describe("Unverified email", () => {
      it("should reject request when email is not verified", async () => {
        const user = await prisma.user.create({
          data: {
            email: "unverified@example.com",
            passwordHash: "dummy-hash",
            emailVerified: false,
          },
        });

        const token = signAccessToken({ userId: user.id, email: user.email });

        const res = await request(app)
          .get("/verified-protected")
          .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(403);
        expect(res.body.error.code).toBe(ErrorCodes.EMAIL_NOT_VERIFIED);
        expect(res.body.error.message).toContain("Email verification required");
      });
    });

    describe("User not found after auth", () => {
      it("should reject request when user does not exist after authentication", async () => {
        const user = await prisma.user.create({
          data: {
            email: "todelete@example.com",
            passwordHash: "dummy-hash",
            emailVerified: true,
          },
        });

        const token = signAccessToken({ userId: user.id, email: user.email });

        await prisma.user.delete({
          where: { id: user.id },
        });

        const res = await request(app)
          .get("/verified-protected")
          .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe(ErrorCodes.UNAUTHORIZED);
        expect(res.body.error.message).toContain("User not found");
      });
    });
  });
});
