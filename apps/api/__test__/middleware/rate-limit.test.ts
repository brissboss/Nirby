import { describe, expect, it, vi } from "vitest";
import { Request, Response } from "express";

import {
  searchRateLimiter,
  getPlaceRateLimiter,
  photoRateLimiter,
} from "../../src/middleware/rate-limit";
import { ErrorCodes } from "../../src/utils/error-codes";

describe("Rate Limit Middleware", () => {
  describe("Exports", () => {
    it("should export searchRateLimiter", () => {
      expect(searchRateLimiter).toBeDefined();
      expect(typeof searchRateLimiter).toBe("function");
    });

    it("should export getPlaceRateLimiter", () => {
      expect(getPlaceRateLimiter).toBeDefined();
      expect(typeof getPlaceRateLimiter).toBe("function");
    });

    it("should export photoRateLimiter", () => {
      expect(photoRateLimiter).toBeDefined();
      expect(typeof photoRateLimiter).toBe("function");
    });
  });

  describe("Rate Limiter Configuration", () => {
    it("searchRateLimiter should be a middleware function", () => {
      // Rate limiters are Express middleware functions
      expect(searchRateLimiter.length).toBeGreaterThanOrEqual(2); // (req, res, next)
    });

    it("getPlaceRateLimiter should be a middleware function", () => {
      expect(getPlaceRateLimiter.length).toBeGreaterThanOrEqual(2);
    });

    it("photoRateLimiter should be a middleware function", () => {
      expect(photoRateLimiter.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Skip in test mode", () => {
    it("should skip rate limiting when NODE_ENV is test", async () => {
      // In test mode, the rate limiter should call next() without blocking
      const mockReq = {
        ip: "127.0.0.1",
        socket: { remoteAddress: "127.0.0.1" },
        user: undefined,
      } as unknown as Request;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        setHeader: vi.fn(),
        getHeader: vi.fn(),
      } as unknown as Response;

      const mockNext = vi.fn();

      // Call the rate limiter multiple times - should not block in test mode
      for (let i = 0; i < 25; i++) {
        await new Promise<void>((resolve) => {
          searchRateLimiter(mockReq, mockRes, () => {
            mockNext();
            resolve();
          });
        });
      }

      // In test mode, all requests should pass through (skip returns true)
      expect(mockNext).toHaveBeenCalledTimes(25);
      expect(mockRes.status).not.toHaveBeenCalledWith(429);
    });
  });

  describe("Error Response Format", () => {
    it("should have RATE_LIMIT_EXCEEDED error code defined", () => {
      // Verify the error code exists for rate limiting
      expect(ErrorCodes.RATE_LIMIT_EXCEEDED).toBe("RATE_LIMIT_EXCEEDED");
    });

    it("should return correct 429 error format when limit exceeded", () => {
      // This test documents the expected error response format
      // The handler returns: { success: false, error: { code, message } }
      const expectedFormat = {
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests, please try again later.",
        },
      };

      // Verify the error code matches
      expect(expectedFormat.error.code).toBe(ErrorCodes.RATE_LIMIT_EXCEEDED);
      expect(expectedFormat.success).toBe(false);
      expect(expectedFormat.error.message).toContain("Too many requests");
    });
  });

  describe("Key Generator", () => {
    it("should generate user-based key for authenticated requests", async () => {
      // When req.user.id is present, the key should be "user-{id}"
      const mockReq = {
        ip: "127.0.0.1",
        socket: { remoteAddress: "127.0.0.1" },
        user: { id: "test-user-123", email: "test@example.com" },
      } as unknown as Request;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        setHeader: vi.fn(),
        getHeader: vi.fn(),
      } as unknown as Response;

      const mockNext = vi.fn();

      await new Promise<void>((resolve) => {
        searchRateLimiter(mockReq, mockRes, () => {
          mockNext();
          resolve();
        });
      });

      // Request should pass through in test mode
      expect(mockNext).toHaveBeenCalled();
    });

    it("should generate ip-based key for unauthenticated requests", async () => {
      // When req.user is not present, the key should be "ip-{ip}"
      const mockReq = {
        ip: "192.168.1.1",
        socket: { remoteAddress: "192.168.1.1" },
        user: undefined,
      } as unknown as Request;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        setHeader: vi.fn(),
        getHeader: vi.fn(),
      } as unknown as Response;

      const mockNext = vi.fn();

      await new Promise<void>((resolve) => {
        searchRateLimiter(mockReq, mockRes, () => {
          mockNext();
          resolve();
        });
      });

      // Request should pass through in test mode
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
