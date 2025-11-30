import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { createServer } from "../../src/server";
import { prisma } from "../../src/db";
import { ErrorCodes } from "../../src/utils/error-codes";

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
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("refreshToken");
      expect(res.body.user.email).toBe("test@example.com");
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
      const signupRes = await request(app).post("/auth/signup").send({
        email: "refresh@example.com",
        password: "password123",
      });
      refreshToken = signupRes.body.refreshToken;
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
      const signupRes = await request(app).post("/auth/signup").send({
        email: "logout@example.com",
        password: "password123",
      });
      refreshToken = signupRes.body.refreshToken;
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
      const signupRes = await request(app).post("/auth/signup").send({
        email: "me@example.com",
        password: "password123",
      });
      accessToken = signupRes.body.accessToken;
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
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("refreshToken");
      expect(res.body.user.email).toBe("strong@example.com");
    });
  });
});
