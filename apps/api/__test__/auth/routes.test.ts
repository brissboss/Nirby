import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import crypto from "crypto";
import request from "supertest";
import { createServer } from "../../src/server";
import { prisma } from "../../src/db";
import { ErrorCodes } from "../../src/utils/error-codes";
import { hashPassword } from "../../src/auth/hash";
import { signAccessToken } from "../../src/auth/token";

const app = createServer();

describe("Auth routes", () => {
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

  describe("POST /auth/signup", () => {
    it("should create a new user", async () => {
      const res = await request(app).post("/auth/signup").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("user");
      expect(res.body).toHaveProperty("message");
      expect(res.body.user.email).toBe("test@example.com");

      const user = await prisma.user.findUnique({ where: { email: "test@example.com" } });

      expect(user).toBeTruthy();
      expect(user?.emailVerified).toBe(false);
      expect(user?.emailVerificationToken).toBeTruthy();
    });

    it("should reject duplicate email", async () => {
      await request(app).post("/auth/signup").send({
        email: "duplicate@example.com",
        password: "password123",
      });

      const res = await request(app).post("/auth/signup").send({
        email: "duplicate@example.com",
        password: "password123",
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("EMAIL_IN_USE");
    });

    it("should reject invalid email", async () => {
      const res = await request(app).post("/auth/signup").send({
        email: "invalid-email",
        password: "password123",
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject short password", async () => {
      const res = await request(app).post("/auth/signup").send({
        email: "test@example.com",
        password: "short",
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/auth/signup").send({
        email: "login@example.com",
        password: "password123",
      });
    });

    it("should login with valid credentials", async () => {
      const res = await request(app).post("/auth/login").send({
        email: "login@example.com",
        password: "password123",
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("refreshToken");
      expect(res.body.user.email).toBe("login@example.com");
    });

    it("should reject invalid email", async () => {
      const res = await request(app).post("/auth/login").send({
        email: "wrong@example.com",
        password: "password123",
      });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("should reject invalid password", async () => {
      const res = await request(app).post("/auth/login").send({
        email: "login@example.com",
        password: "wrongpassword",
      });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    });
  });

  describe("POST /auth/refresh", () => {
    let refreshToken: string;

    beforeEach(async () => {
      const passwordHash = await hashPassword("password123");
      const user = await prisma.user.create({
        data: {
          email: "refresh@example.com",
          passwordHash,
          emailVerified: true,
        },
      });

      refreshToken = crypto.randomBytes(64).toString("hex");
      await prisma.session.create({
        data: {
          userId: user.id,
          refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    });

    it("should refresh access token", async () => {
      const res = await request(app).post("/auth/refresh").send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
    });

    it("should reject invalid refresh token", async () => {
      const res = await request(app).post("/auth/refresh").send({ refreshToken: "invalid-token" });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_REFRESH_TOKEN");
    });

    it("should reject expired refresh token", async () => {
      const user = await prisma.user.findUnique({ where: { email: "refresh@example.com" } });
      if (!user) throw new Error("User not found");

      const expiredSession = await prisma.session.create({
        data: {
          userId: user.id,
          refreshToken: "expired-token",
          expiresAt: new Date(Date.now() - 1000),
        },
      });

      const res = await request(app)
        .post("/auth/refresh")
        .send({ refreshToken: expiredSession.refreshToken });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_REFRESH_TOKEN");

      const deleted = await prisma.session.findUnique({
        where: { id: expiredSession.id },
      });
      expect(deleted).toBeNull();
    });

    it("should reject missing refresh token", async () => {
      const res = await request(app).post("/auth/refresh").send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /auth/logout", () => {
    let refreshToken: string;

    beforeEach(async () => {
      const passwordHash = await hashPassword("password123");
      const user = await prisma.user.create({
        data: {
          email: "logout@example.com",
          passwordHash,
          emailVerified: true,
        },
      });

      refreshToken = crypto.randomBytes(64).toString("hex");
      await prisma.session.create({
        data: {
          userId: user.id,
          refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    });

    it("should logout successfully", async () => {
      const res = await request(app).post("/auth/logout").send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Logged out successfully");
    });

    it("should reject missing refresh token", async () => {
      const res = await request(app).post("/auth/logout").send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /auth/me", () => {
    let accessToken: string;

    beforeEach(async () => {
      const passwordHash = await hashPassword("password123");
      const user = await prisma.user.create({
        data: {
          email: "me@example.com",
          passwordHash,
          emailVerified: true,
        },
      });

      accessToken = signAccessToken({ userId: user.id, email: user.email });
    });

    it("should return user profile with valid token", async () => {
      const res = await request(app).get("/auth/me").set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe("me@example.com");
    });

    it("should reject request without token", async () => {
      const res = await request(app).get("/auth/me");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("should reject request with invalid token", async () => {
      const res = await request(app).get("/auth/me").set("Authorization", "Bearer invalid-token");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  //   Security tests
  describe("POST /auth/signup - Security", () => {
    it("should reject extremely long email", async () => {
      const longEmail = "a".repeat(1000) + "@example.com";

      const res = await request(app).post("/auth/signup").send({
        email: longEmail,
        password: "password123",
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCodes.VALIDATION_ERROR);
    });

    it("should reject SQL injection attempts in email", async () => {
      const sqlInjectionEmail = "test'; DROP TABLE users; --@example.com";

      const res = await request(app).post("/auth/signup").send({
        email: sqlInjectionEmail,
        password: "password123",
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCodes.VALIDATION_ERROR);
    });

    it("should accept password with special characters", async () => {
      const strongPassword = "P@ssw0rd!$#%^&*()";

      const res = await request(app).post("/auth/signup").send({
        email: "strong@example.com",
        password: strongPassword,
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("user");
      expect(res.body.user.email).toBe("strong@example.com");
    });
  });

  describe("Get /auth/verify-email", () => {
    it("should verify email with valid token", async () => {
      const user = await prisma.user.create({
        data: {
          email: "verify@example.com",
          passwordHash: "dummy-hash",
          emailVerified: false,
          emailVerificationToken: "valid-token-123",
          emailVerificationExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 1000),
        },
      });

      const res = await request(app)
        .get("/auth/verify-email")
        .query({ token: "valid-token-123" })
        .set("Accept", "application/json");

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Email verified successfully");
      expect(res.body.user.email).toBe("verify@example.com");

      const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });

      expect(updatedUser?.emailVerified).toBe(true);
      expect(updatedUser?.emailVerificationToken).toBeNull();
    });

    it("should reject invalid token", async () => {
      const res = await request(app)
        .get("/auth/verify-email")
        .query({ token: "invalid-token-that-does-not-exist" })
        .set("Accept", "application/json");

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe(ErrorCodes.TOKEN_EXPIRED);
      expect(res.body.error.message).toBe("Invalid or expired token");
    });

    it("should reject expired token", async () => {
      await prisma.user.create({
        data: {
          email: "expired@example.com",
          passwordHash: "dummy-hash",
          emailVerified: false,
          emailVerificationToken: "expired-token-123",
          emailVerificationExpiresAt: new Date(Date.now() - 1000),
        },
      });

      const res = await request(app)
        .get("/auth/verify-email")
        .query({ token: "expired-token-123" })
        .set("Accept", "application/json");

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe(ErrorCodes.TOKEN_EXPIRED);
      expect(res.body.error.message).toContain("Invalid or expired token");
    });

    it("should reject already verified email", async () => {
      await prisma.user.create({
        data: {
          email: "already@example.com",
          passwordHash: "dummy-hash",
          emailVerified: true,
          emailVerificationToken: "some-token-123",
          emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      const res = await request(app)
        .get("/auth/verify-email")
        .query({ token: "some-token-123" })
        .set("Accept", "application/json");

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCodes.EMAIL_ALREADY_VERIFIED);
      expect(res.body.error.message).toBe("Email already verified");
    });

    it("should require token parameter", async () => {
      const res = await request(app).get("/auth/verify-email").set("Accept", "application/json");

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCodes.TOKEN_REQUIRED);
      expect(res.body.error.message).toBe("Token is required");
    });
  });

  describe("POST /auth/resend-verification", () => {
    it("should resend verification email for unverified user", async () => {
      const user = await prisma.user.create({
        data: {
          email: "resend@example.com",
          passwordHash: "dummy-hash",
          emailVerified: false,
          emailVerificationToken: "old-token-123",
          emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      const res = await request(app)
        .post("/auth/resend-verification")
        .send({ email: "resend@example.com" });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("verification email has been sent");

      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(updatedUser?.emailVerificationToken).not.toBe("old-token-123");
      expect(updatedUser?.emailVerificationToken).toBeTruthy();
      expect(updatedUser?.emailVerificationExpiresAt).toBeTruthy();
    });

    it("should reject already verified email", async () => {
      await prisma.user.create({
        data: {
          email: "verified@example.com",
          passwordHash: "dummy-hash",
          emailVerified: true,
        },
      });

      const res = await request(app)
        .post("/auth/resend-verification")
        .send({ email: "verified@example.com" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCodes.EMAIL_ALREADY_VERIFIED);
      expect(res.body.error.message).toBe("Email already verified");
    });

    it("should return success even if email doesn't exist (security)", async () => {
      const res = await request(app)
        .post("/auth/resend-verification")
        .send({ email: "nonexistent@example.com" });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("verification email has been sent");
    });

    it("should validate email format", async () => {
      const res = await request(app)
        .post("/auth/resend-verification")
        .send({ email: "invalid-email" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCodes.VALIDATION_ERROR);
    });
  });

  describe("POST /auth/forgot-password", () => {
    it("should return success for existing user", async () => {
      await prisma.user.create({
        data: {
          email: "forgot@example.com",
          passwordHash: "dummy-hash",
          emailVerified: true,
        },
      });

      const res = await request(app)
        .post("/auth/forgot-password")
        .send({ email: "forgot@example.com" });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("password reset email");

      const user = await prisma.user.findUnique({ where: { email: "forgot@example.com" } });
      expect(user?.passwordResetToken).toBeTruthy();
      expect(user?.passwordResetExpiresAt).toBeTruthy();
    });

    it("should return success even if email doesn't exist (security)", async () => {
      const res = await request(app)
        .post("/auth/forgot-password")
        .send({ email: "nonexistent@example.com" });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("password reset email");
    });

    it("should validate email format", async () => {
      const res = await request(app).post("/auth/forgot-password").send({ email: "invalid-email" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCodes.VALIDATION_ERROR);
    });
  });

  describe("POST /auth/reset-password", () => {
    it("should reset password with valid token", async () => {
      const passwordHash = await hashPassword("oldpassword123");
      await prisma.user.create({
        data: {
          email: "reset@example.com",
          passwordHash,
          emailVerified: true,
          passwordResetToken: "valid-reset-token",
          passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      const res = await request(app)
        .post("/auth/reset-password")
        .send({ token: "valid-reset-token", password: "newpassword123" });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("Password reset successfully");

      const user = await prisma.user.findUnique({ where: { email: "reset@example.com" } });
      expect(user?.passwordResetToken).toBeNull();
      expect(user?.passwordResetExpiresAt).toBeNull();

      const loginRes = await request(app)
        .post("/auth/login")
        .send({ email: "reset@example.com", password: "newpassword123" });
      expect(loginRes.status).toBe(200);
    });

    it("should reject invalid token", async () => {
      const res = await request(app)
        .post("/auth/reset-password")
        .send({ token: "invalid-token", password: "newpassword123" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCodes.TOKEN_EXPIRED);
    });

    it("should reject expired token", async () => {
      await prisma.user.create({
        data: {
          email: "expired-reset@example.com",
          passwordHash: "dummy-hash",
          emailVerified: true,
          passwordResetToken: "expired-token",
          passwordResetExpiresAt: new Date(Date.now() - 1000),
        },
      });

      const res = await request(app)
        .post("/auth/reset-password")
        .send({ token: "expired-token", password: "newpassword123" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCodes.TOKEN_EXPIRED);
    });

    it("should reject short password", async () => {
      const res = await request(app)
        .post("/auth/reset-password")
        .send({ token: "some-token", password: "short" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCodes.VALIDATION_ERROR);
    });

    it("should invalidate all sessions after password reset", async () => {
      const passwordHash = await hashPassword("oldpassword123");
      const user = await prisma.user.create({
        data: {
          email: "sessions@example.com",
          passwordHash,
          emailVerified: true,
          passwordResetToken: "session-test-token",
          passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      await prisma.session.create({
        data: {
          userId: user.id,
          refreshToken: "old-refresh-token",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      await request(app)
        .post("/auth/reset-password")
        .send({ token: "session-test-token", password: "newpassword123" });

      const sessions = await prisma.session.findMany({ where: { userId: user.id } });
      expect(sessions).toHaveLength(0);
    });
  });
});
