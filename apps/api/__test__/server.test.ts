import { describe, it, expect } from "vitest";
import request from "supertest";
import express, { Request, Response, NextFunction } from "express";
import { createServer } from "../src/server";
import { ApiError, formatError } from "../src/utils/errors";
import { ErrorCodes, ErrorCode } from "../src/utils/error-codes";

const app = createServer();

describe("Server routes", () => {
  describe("GET /docs", () => {
    it("should serve documentation", async () => {
      const res = await request(app).get("/docs");

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/html");
    });
  });

  describe("GET /docs.json", () => {
    it("should return OpenAPI spec", async () => {
      const res = await request(app).get("/docs.json");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("openapi");
      expect(res.body).toHaveProperty("info");
    });
  });

  describe("GET /health", () => {
    it("should return health status", async () => {
      const res = await request(app).get("/health");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("ok", true);
      expect(res.body).toHaveProperty("service", "api");
      expect(res.body).toHaveProperty("time");
    });
  });

  describe("GET /db/health", () => {
    it("should return database health status", async () => {
      const res = await request(app).get("/db/health");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("ok", true);
      expect(res.body).toHaveProperty("db");
    });
  });

  describe("404 handler", () => {
    it("should return 404 for unknown routes", async () => {
      const res = await request(app).get("/unknown-route");

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe(ErrorCodes.NOT_FOUND);
      expect(res.body.error.message).toBe("Not Found");
    });
  });

  describe("Error handler", () => {
    it("should handle ApiError correctly", async () => {
      const testApp = express();
      testApp.use(express.json());

      testApp.get("/test-api-error", (req, res, next) => {
        next(new ApiError(400, ErrorCodes.VALIDATION_ERROR, "Test error", { field: "test" }));
      });

      // 404 handler
      testApp.use((req: Request, res: Response) => {
        res.status(404).json(formatError(ErrorCodes.NOT_FOUND, "Not Found"));
      });

      testApp.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
        if (err instanceof ApiError) {
          return res
            .status(err.statusCode)
            .json(formatError(err.code as ErrorCode, err.message, err.details));
        }
        return res
          .status(500)
          .json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
      });

      const res = await request(testApp).get("/test-api-error");

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect(res.body.error.message).toBe("Test error");
      expect(res.body.error.details).toEqual({ field: "test" });
    });

    it("should handle generic errors with 500", async () => {
      const testApp = express();
      testApp.use(express.json());

      testApp.get("/test-generic-error", (req, res, next) => {
        next(new Error("Generic error"));
      });

      // 404 handler
      testApp.use((req: Request, res: Response) => {
        res.status(404).json(formatError(ErrorCodes.NOT_FOUND, "Not Found"));
      });

      testApp.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
        if (err instanceof ApiError) {
          return res
            .status(err.statusCode)
            .json(formatError(err.code as ErrorCode, err.message, err.details));
        }
        return res
          .status(500)
          .json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
      });

      const res = await request(testApp).get("/test-generic-error");

      expect(res.status).toBe(500);
      expect(res.body.error.code).toBe(ErrorCodes.INTERNAL_ERROR);
    });

    it("should handle generic errors from real server with 500", async () => {
      const res = await request(app).get("/test-error");

      expect(res.status).toBe(500);
      expect(res.body.error.code).toBe(ErrorCodes.INTERNAL_ERROR);
      expect(res.body.error.message).toBe("Internal server error");
    });
  });
});
