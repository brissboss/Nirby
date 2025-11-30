import crypto from "crypto";

import { Router } from "express";
import { z } from "zod";

import { prisma } from "../db";
import { env } from "../env";
import { ErrorCodes } from "../utils/error-codes";
import { formatError, handleZodError } from "../utils/errors";

import { hashPassword, verifyPassword } from "./hash";
import { requireAuth } from "./middleware";
import { signAccessToken } from "./token";

export const authRouter = Router();

const authSchema = z.object({
  email: z
    .string({ required_error: ErrorCodes.EMAIL_REQUIRED })
    .email(ErrorCodes.INVALID_EMAIL)
    .max(255, ErrorCodes.EMAIL_TOO_LONG),
  password: z
    .string({ required_error: ErrorCodes.PASSWORD_REQUIRED })
    .min(8, ErrorCodes.PASSWORD_TOO_SHORT)
    .max(255, ErrorCodes.PASSWORD_TOO_LONG),
});

/**
 * @openapi
 * /auth/signup:
 *   post:
 *     summary: Sign up a new user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "password123"
 *             required:
 *               - email
 *               - password
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Email already in use
 *       500:
 *         description: Internal server error
 */
authRouter.post("/signup", async (req, res) => {
  try {
    const { email, password } = authSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res
        .status(400)
        .json(formatError(ErrorCodes.EMAIL_IN_USE, "This email is already in use"));
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: { email, passwordHash },
    });

    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    const refreshToken = crypto.randomBytes(64).toString("hex");

    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL * 1000);

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt,
      },
    });

    res.status(201).json({
      user: { id: user.id, email: user.email },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const details = handleZodError(err);
      return res
        .status(400)
        .json(formatError(ErrorCodes.VALIDATION_ERROR, "Invalid input", details));
    }
    req.log?.error({ err });

    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "password123"
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = authSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res
        .status(401)
        .json(formatError(ErrorCodes.INVALID_CREDENTIALS, "Invalid email or password"));
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return res
        .status(401)
        .json(formatError(ErrorCodes.INVALID_CREDENTIALS, "Invalid email or password"));
    }

    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    const refreshToken = crypto.randomBytes(64).toString("hex");

    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL * 1000);

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt,
      },
    });

    res.json({
      user: { id: user.id, email: user.email },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const details = handleZodError(err);
      return res
        .status(400)
        .json(formatError(ErrorCodes.VALIDATION_ERROR, "Invalid input", details));
    }
    req.log?.error({ err });

    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Refresh an access token
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *             required:
 *               - refreshToken
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid or expired refresh token
 *       500:
 *         description: Internal server error
 */
authRouter.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = z
      .object({ refreshToken: z.string({ required_error: ErrorCodes.REFRESH_TOKEN_REQUIRED }) })
      .parse(req.body);

    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session) {
      return res
        .status(401)
        .json(formatError(ErrorCodes.INVALID_REFRESH_TOKEN, "Invalid refresh token"));
    }

    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } });
      return res
        .status(401)
        .json(formatError(ErrorCodes.INVALID_REFRESH_TOKEN, "Expired refresh token"));
    }

    const accessToken = signAccessToken({
      userId: session.userId,
      email: session.user.email,
    });

    res.json({ accessToken });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const details = handleZodError(err);
      return res
        .status(400)
        .json(formatError(ErrorCodes.VALIDATION_ERROR, "Invalid input", details));
    }
    req.log?.error({ err });

    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Logout and invalidate session
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *             required:
 *               - refreshToken
 *     responses:
 *       200:
 *         description: Logout successful
 *       500:
 *         description: Internal server error
 */
authRouter.post("/logout", async (req, res) => {
  try {
    const { refreshToken } = z
      .object({ refreshToken: z.string({ required_error: ErrorCodes.REFRESH_TOKEN_REQUIRED }) })
      .parse(req.body);

    await prisma.session.delete({ where: { refreshToken } });

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const details = handleZodError(err);
      return res
        .status(400)
        .json(formatError(ErrorCodes.VALIDATION_ERROR, "Invalid input", details));
    }
    req.log?.error({ err });

    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
authRouter.get("/me", requireAuth, async (req, res) => {
  res.json({ user: req.user });
});
