import crypto from "crypto";

import { Router } from "express";
import { z } from "zod";

import { prisma } from "../db";
import {
  sendAccountDeletedEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../email/service";
import { env } from "../env";
import { authBrutForceRateLimiter, authSpamRateLimiter } from "../middleware/rate-limit";
import { SUPPORTED_LANGUAGES } from "../types";
import { ErrorCodes } from "../utils/error-codes";
import { formatError, handleZodError } from "../utils/errors";

import { hashPassword, verifyPassword } from "./hash";
import { requireAuth } from "./middleware";
import { signAccessToken } from "./token";
import { generateVerificationToken, getVerificationTokenExpiration } from "./verification";

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
  language: z.enum(SUPPORTED_LANGUAGES).optional().default("en"),
});

const resendVerificationEmailSchema = z.object({
  email: z
    .string({ required_error: ErrorCodes.EMAIL_REQUIRED })
    .email(ErrorCodes.INVALID_EMAIL)
    .max(255, ErrorCodes.EMAIL_TOO_LONG),
  language: z.enum(SUPPORTED_LANGUAGES).optional().default("en"),
});

const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: ErrorCodes.EMAIL_REQUIRED })
    .email(ErrorCodes.INVALID_EMAIL)
    .max(255, ErrorCodes.EMAIL_TOO_LONG),
  language: z.enum(SUPPORTED_LANGUAGES).optional().default("en"),
});

const resetPasswordSchema = z.object({
  token: z.string({ required_error: ErrorCodes.TOKEN_REQUIRED }),
  password: z
    .string({ required_error: ErrorCodes.PASSWORD_REQUIRED })
    .min(8, ErrorCodes.PASSWORD_TOO_SHORT)
    .max(255, ErrorCodes.PASSWORD_TOO_LONG),
});

const changePasswordSchema = z.object({
  oldPassword: z.string({ required_error: ErrorCodes.PASSWORD_REQUIRED }),
  newPassword: z
    .string({ required_error: ErrorCodes.PASSWORD_REQUIRED })
    .min(8, ErrorCodes.PASSWORD_TOO_SHORT)
    .max(255, ErrorCodes.PASSWORD_TOO_LONG),
});

const deleteAccountSchema = z.object({
  password: z.string({ required_error: ErrorCodes.PASSWORD_REQUIRED }),
  language: z.enum(SUPPORTED_LANGUAGES).optional().default("en"),
});

const updateProfileSchema = z.object({
  name: z
    .string()
    .max(255, ErrorCodes.NAME_TOO_LONG)
    .nullable()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  avatarUrl: z
    .string()
    .url(ErrorCodes.INVALID_URL)
    .nullable()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  bio: z
    .string()
    .max(255, ErrorCodes.BIO_TOO_LONG)
    .nullable()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
});

/**
 * @openapi
 * /auth/signup:
 *   post:
 *     operationId: signup
 *     summary: Sign up a new user
 *     tags:
 *       - 🔐 Auth
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
 *               language:
 *                 type: string
 *                 enum: [fr, en]
 *                 default: en
 *             required:
 *               - email
 *               - password
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SignupResponse'
 *       400:
 *         description: Email already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
authRouter.post("/signup", authSpamRateLimiter, async (req, res) => {
  try {
    const { email, password, language } = authSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res
        .status(400)
        .json(formatError(ErrorCodes.EMAIL_IN_USE, "This email is already in use"));
    }

    const passwordHash = await hashPassword(password);

    const verificationToken = generateVerificationToken();
    const verificationExpires = getVerificationTokenExpiration(24);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpiresAt: verificationExpires,
      },
    });

    try {
      await sendVerificationEmail(email, verificationToken, language);
    } catch (emailError) {
      req.log?.error(
        {
          emailError,
          userId: user.id,
        },
        "Failed to send verification email"
      );
    }

    res.status(201).json({
      user: { id: user.id, email: user.email },
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
 * /auth/verify-email:
 *   get:
 *     operationId: verifyEmail
 *     summary: Verify user email address
 *     tags:
 *       - 🔐 Auth
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VerifyEmailResponse'
 *       302:
 *         description: Redirect to the verification email page
 *         headers:
 *           Location:
 *             description: URL to redirect to
 *             schema:
 *               type: string
 *               format: uri
 *               example: "http://localhost:3000/verify-email?success=true"
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Token not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
authRouter.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).json(formatError(ErrorCodes.TOKEN_REQUIRED, "Token is required"));
    }

    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res
        .status(404)
        .json(formatError(ErrorCodes.TOKEN_EXPIRED, "Invalid or expired token"));
    }

    if (user.emailVerified) {
      return res
        .status(400)
        .json(formatError(ErrorCodes.EMAIL_ALREADY_VERIFIED, "Email already verified"));
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
      },
    });

    // Check if the request is from Scalar or an API request
    const isFromScalar = req.headers.referer?.includes("/docs");
    const isApiRequest =
      req.headers.accept?.includes("application/json") ||
      req.query.format === "json" ||
      isFromScalar;

    const redirectUrl = `${env.FRONTEND_URL}/verify-email?success=true`;
    if (isApiRequest) {
      return res.status(200).json({
        user: { id: user.id, email: user.email },
        redirectUrl,
      });
    } else {
      return res.redirect(redirectUrl);
    }
  } catch (err) {
    req.log?.error({ err });

    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});

/**
 * @openapi
 * /auth/resend-verification:
 *   post:
 *     operationId: resendVerification
 *     summary: Resend email verification
 *     tags:
 *       - 🔐 Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               language:
 *                 type: string
 *                 enum: [fr, en]
 *                 default: en
 *     responses:
 *       200:
 *         description: Verification email sent (if user exists and not verified)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SingleMessageResponse'
 *       400:
 *         description: Invalid input or email already verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
authRouter.post("/resend-verification", async (req, res) => {
  try {
    const { email, language } = resendVerificationEmailSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(200).json({
        message: "If the email exists and is not verified, a verification email has been sent",
      });
    }

    if (user.emailVerified) {
      return res
        .status(400)
        .json(formatError(ErrorCodes.EMAIL_ALREADY_VERIFIED, "Email already verified"));
    }

    const verificationToken = generateVerificationToken();
    const verificationExpires = getVerificationTokenExpiration(24);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpiresAt: verificationExpires,
      },
    });

    try {
      await sendVerificationEmail(email, verificationToken, language || "en");
    } catch (emailError) {
      req.log?.error(
        {
          emailError,
          userId: user.id,
        },
        "Failed to send verification email"
      );
    }

    res.status(200).json({
      message: "If the email exists and is not verified, a verification email has been sent",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const details = handleZodError(err);
      return res
        .status(400)
        .json(formatError(ErrorCodes.VALIDATION_ERROR, "Invalid input", details));
    }

    throw err;
  }
});

/**
 * @openapi
 * /auth/login:
 *   post:
 *     operationId: login
 *     summary: Login a user
 *     tags:
 *       - 🔐 Auth
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Email not verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
authRouter.post("/login", authBrutForceRateLimiter, async (req, res) => {
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

    if (!user.emailVerified) {
      return res.status(403).json(
        formatError(
          ErrorCodes.EMAIL_NOT_VERIFIED,
          "Please verify your email before logging in. Check your inbox or resend the verification email.",
          {
            email: user.email,
          }
        )
      );
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
 *     operationId: refreshToken
 *     summary: Refresh an access token
 *     tags:
 *       - 🔐 Auth
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshTokenResponse'
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 *     operationId: logout
 *     summary: Logout and invalidate session
 *     tags:
 *       - 🔐 Auth
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SingleMessageResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * /auth/forgot-password:
 *   post:
 *     operationId: forgotPassword
 *     summary: Request a password reset
 *     tags:
 *       - 🔐 Auth
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
 *               language:
 *                 type: string
 *                 enum: [fr, en]
 *                 default: en
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: If the email exists, a password reset email has been sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SingleMessageResponse'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
authRouter.post("/forgot-password", authSpamRateLimiter, async (req, res) => {
  try {
    const { email, language } = forgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const resetToken = generateVerificationToken();
      const resetExpires = getVerificationTokenExpiration(1);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpiresAt: resetExpires,
        },
      });

      await sendPasswordResetEmail(email, resetToken, language);
    }

    res.json({ message: "If the email exists, a password reset email has been sent" });
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
 * /auth/reset-password:
 *   post:
 *     operationId: resetPassword
 *     summary: Reset password with token
 *     tags:
 *       - 🔐 Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token received by email
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: New password
 *             required:
 *               - token
 *               - password
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SingleMessageResponse'
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
authRouter.post("/reset-password", authBrutForceRateLimiter, async (req, res) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res
        .status(400)
        .json(formatError(ErrorCodes.TOKEN_EXPIRED, "Invalid or expired token"));
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    await prisma.session.deleteMany({ where: { userId: user.id } });

    res.json({ message: "Password reset successfully" });
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
 * /auth/change-password:
 *   post:
 *     operationId: changePassword
 *     summary: Change user password
 *     description: Allows an authenticated user to change their password. All existing sessions will be invalidated after the password is changed.
 *     tags:
 *       - 🔐 Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: New password (must be different from old password)
 *             required:
 *               - oldPassword
 *               - newPassword
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SingleMessageResponse'
 *       400:
 *         description: Invalid input or new password same as old
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized or invalid old password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
authRouter.post("/change-password", requireAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);

    if (oldPassword === newPassword) {
      return res
        .status(400)
        .json(
          formatError(
            ErrorCodes.PASSWORD_SAME,
            "New password cannot be the same as the old password"
          )
        );
    }

    const user = await prisma.user.findUnique({ where: { id: req.user?.id } });

    if (!user) {
      return res.status(404).json(formatError(ErrorCodes.NOT_FOUND, "User not found"));
    }

    const valid = await verifyPassword(oldPassword, user.passwordHash);
    if (!valid) {
      return res
        .status(401)
        .json(formatError(ErrorCodes.INVALID_CREDENTIALS, "Invalid old password"));
    }

    const newPasswordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newPasswordHash } });

    await prisma.session.deleteMany({ where: { userId: user.id } });

    res.json({ message: "Password changed successfully" });
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
 * /auth/account:
 *   delete:
 *     operationId: deleteAccount
 *     summary: Delete user account
 *     description: Permanently deletes the authenticated user's account and all associated data. A confirmation email will be sent.
 *     tags:
 *       - 🔐 Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 description: Current password for confirmation
 *               language:
 *                 type: string
 *                 enum: [fr, en]
 *                 default: en
 *                 description: Language for the confirmation email
 *             required:
 *               - password
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SingleMessageResponse'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized or invalid password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
authRouter.delete("/account", requireAuth, async (req, res) => {
  try {
    const { password, language } = deleteAccountSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user?.id } });
    if (!user) {
      return res.status(404).json(formatError(ErrorCodes.NOT_FOUND, "User not found"));
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json(formatError(ErrorCodes.INVALID_CREDENTIALS, "Invalid password"));
    }

    const email = user.email;

    await prisma.session.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });

    await sendAccountDeletedEmail(email, language || "en");

    res.json({ message: "Account deleted successfully" });
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
 *     operationId: getMe
 *     summary: Get current user profile
 *     tags:
 *       - 🔐 Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetMeResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
authRouter.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user?.id } });
    if (!user) {
      return res.status(404).json(formatError(ErrorCodes.NOT_FOUND, "User not found"));
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        emailVerified: user.emailVerified,
      },
    });
  } catch (err) {
    req.log?.error({ err });
    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});

/**
 * @openapi
 * /auth/me:
 *   put:
 *     operationId: updateMe
 *     summary: Update current user profile
 *     tags:
 *       - 🔐 Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: New name
 *               avatarUrl:
 *                 type: string
 *                 description: New avatar URL
 *               bio:
 *                 type: string
 *                 description: New bio
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetMeResponse'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
authRouter.put("/me", requireAuth, async (req, res) => {
  try {
    const { name, avatarUrl, bio } = updateProfileSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user?.id } });
    if (!user) {
      return res.status(404).json(formatError(ErrorCodes.NOT_FOUND, "User not found"));
    }

    const updateData: { name?: string | null; avatarUrl?: string | null; bio?: string | null } = {};
    if (name !== undefined) updateData.name = name;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (bio !== undefined) updateData.bio = bio;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return res.status(200).json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        avatarUrl: updatedUser.avatarUrl,
        bio: updatedUser.bio,
        emailVerified: updatedUser.emailVerified,
      },
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
