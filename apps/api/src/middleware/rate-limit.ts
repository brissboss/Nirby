import { Request, Response } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import RedisStore from "rate-limit-redis";

import { env } from "../env";
import { redisClient } from "../redis";
import { ErrorCodes } from "../utils/error-codes";
import { formatError } from "../utils/errors";

/**
 * Create a rate limiter with Redis store if available, otherwise use in-memory storage
 */
function createRateLimiter(windowMs: number, max: number, message?: string) {
  const useRedis = redisClient && redisClient.isReady;

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,

    store: useRedis
      ? new RedisStore({
          sendCommand: (...args: string[]) => redisClient!.sendCommand(args),
        })
      : undefined,

    keyGenerator: (req: Request) => {
      if (req.user?.id) {
        return `user-${req.user.id}`;
      }
      const ipKey = ipKeyGenerator(req.ip || req.socket.remoteAddress || "unknown", 56);
      return `ip-${ipKey}`;
    },

    skip: () => env.NODE_ENV === "test",

    handler: (req: Request, res: Response) => {
      res
        .status(429)
        .json(
          formatError(
            ErrorCodes.RATE_LIMIT_EXCEEDED,
            message || "Too many requests, please try again later."
          )
        );
    },
  });
}

/**
 * Rate limiter for Google Place search endpoints
 * 20 requests per hour (most expensive endpoint)
 */
export const searchRateLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  20,
  "Too many requests, please try again in 1 hour"
);

/**
 * Rate limiter for getting a specific Google Place
 * 100 requests per hour (cache available, less expensive)
 */
export const getPlaceRateLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  100,
  "Too many requests, please try again in 1 hour"
);

/**
 * Rate limiter for Google Place photo endpoints
 * 50 requests per hour (moderate cost)
 */
export const photoRateLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  50,
  "Too many requests, please try again in 1 hour"
);

/**
 * Rate limiter for auth brut force protection
 * 10 requests per 15 minutes
 */
export const authBrutForceRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  10,
  "Too many requests, please try again in 15 minutes"
);

/**
 * Rate limiter for auth spam protection
 * 5 requests per 1 hour
 */
export const authSpamRateLimiter = createRateLimiter(
  1 * 60 * 60 * 1000, // 1 hour
  5,
  "Too many requests, please try again in 1 hour"
);

/**
 * Rate limiter for auth email verification
 * 1 request per 1 minute
 */
export const authEmailVerificationRateLimiter = createRateLimiter(
  1 * 60 * 1000, // 1 minute
  1,
  "Too many requests, please try again in 1 minute"
);
