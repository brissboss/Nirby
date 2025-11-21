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

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
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
