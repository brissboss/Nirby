import { Request, Response, NextFunction } from "express";

import { prisma } from "../db";
import { ErrorCodes } from "../utils/error-codes";
import { formatError } from "../utils/errors";

import { verifyAccessToken } from "./token";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json(formatError(ErrorCodes.UNAUTHORIZED, "Missing or invalid authorization header"));
    }

    const token = authHeader.substring(7);

    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return res.status(401).json(formatError(ErrorCodes.UNAUTHORIZED, "User not found"));
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json(formatError(ErrorCodes.UNAUTHORIZED, "Invalid or expired token"));
  }
}

/**
 * Middleware to require both authentication and email verification
 * Must be used after requireAuth middleware
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
async function requireVerifiedEmail(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json(formatError(ErrorCodes.UNAUTHORIZED, "Authentication required"));
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, emailVerified: true },
    });

    if (!user) {
      return res.status(401).json(formatError(ErrorCodes.UNAUTHORIZED, "User not found"));
    }

    if (!user.emailVerified) {
      return res
        .status(403)
        .json(
          formatError(
            ErrorCodes.EMAIL_NOT_VERIFIED,
            "Email verification required. Please check your email and verify your account."
          )
        );
    }

    req.user = { id: user.id, email: user.email };
    next();
  } catch (err) {
    req.log?.error({ err }, "Error in requireVerifiedEmail middleware");
    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
}

export { requireAuth, requireVerifiedEmail };
