import { Router } from "express";
import multer from "multer";

import { requireAuth } from "../auth/middleware";
import { prisma } from "../db";
import { ErrorCodes } from "../utils/error-codes";
import { formatError } from "../utils/errors";

import {
  uploadFile,
  deleteFile,
  generateKey,
  isValidMimeType,
  isValidAvatarSize,
  isValidPoiPhotoSize,
} from "./service";

export const uploadRouter = Router();

// Set multer limit higher than our validation limits so our handler can return proper errors
const MULTER_FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MULTER_FILE_SIZE_LIMIT,
  },
});

/**
 * @openapi
 * /upload/avatar:
 *   post:
 *     operationId: uploadAvatar
 *     summary: Upload user avatar
 *     description: Upload a new avatar for the authenticated user. Replaces the existing avatar if any.
 *     tags:
 *       - 📤 Upload
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, WebP, max 2MB)
 *           encoding:
 *             file:
 *               contentType: image/jpeg, image/png, image/webp
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadResponse'
 *       400:
 *         description: Invalid file type or size
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
uploadRouter.post("/avatar", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json(formatError(ErrorCodes.UPLOAD_FILE_REQUIRED, "File is required"));
    }

    if (!isValidMimeType(file.mimetype)) {
      return res
        .status(400)
        .json(
          formatError(
            ErrorCodes.UPLOAD_INVALID_FILE_TYPE,
            "Invalid file type. Allowed: JPEG, PNG, WebP"
          )
        );
    }

    if (!isValidAvatarSize(file.size)) {
      return res
        .status(400)
        .json(
          formatError(ErrorCodes.UPLOAD_INVALID_FILE_SIZE, "File too large. Maximum size: 2MB")
        );
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { avatarUrl: true },
    });

    const key = generateKey("avatars", req.user!.id, file.mimetype);
    const url = await uploadFile(file.buffer, key, file.mimetype);

    if (user?.avatarUrl) {
      try {
        await deleteFile(user.avatarUrl);
      } catch (err) {
        req.log?.warn({ err }, "Failed to delete old avatar");
      }
    }

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatarUrl: url },
    });

    res.json({ url });
  } catch (err) {
    req.log?.error({ err }, "Failed to upload avatar");
    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});

/**
 * @openapi
 * /upload/poi-photo:
 *   post:
 *     operationId: uploadPoiPhoto
 *     summary: Upload POI photo
 *     description: Upload a photo for a POI. Optionally associate it with a specific POI.
 *     tags:
 *       - 📤 Upload
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, WebP, max 5MB)
 *               poiId:
 *                 type: string
 *                 description: Optional POI ID to associate the photo with
 *           encoding:
 *             file:
 *               contentType: image/jpeg, image/png, image/webp
 *     responses:
 *       200:
 *         description: Photo uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadResponse'
 *       400:
 *         description: Invalid file type or size
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
 *       403:
 *         description: Access denied to POI
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: POI not found
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
uploadRouter.post("/poi-photo", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const { poiId } = req.body;

    if (!file) {
      return res.status(400).json(formatError(ErrorCodes.UPLOAD_FILE_REQUIRED, "File is required"));
    }

    if (!isValidMimeType(file.mimetype)) {
      return res
        .status(400)
        .json(
          formatError(
            ErrorCodes.UPLOAD_INVALID_FILE_TYPE,
            "Invalid file type. Allowed: JPEG, PNG, WebP"
          )
        );
    }

    if (!isValidPoiPhotoSize(file.size)) {
      return res
        .status(400)
        .json(
          formatError(ErrorCodes.UPLOAD_INVALID_FILE_SIZE, "File too large. Maximum size: 5MB")
        );
    }

    if (poiId) {
      const poi = await prisma.poi.findUnique({
        where: { id: poiId },
        select: { id: true, createdBy: true },
      });

      if (!poi) {
        return res.status(404).json(formatError(ErrorCodes.POI_NOT_FOUND, "POI not found"));
      }

      if (poi.createdBy !== req.user!.id) {
        return res
          .status(403)
          .json(formatError(ErrorCodes.POI_ACCESS_DENIED, "Access denied to this POI"));
      }
    }

    const key = generateKey("poi-photos", poiId ?? req.user!.id, file.mimetype);
    const url = await uploadFile(file.buffer, key, file.mimetype);

    if (poiId) {
      await prisma.poi.update({
        where: { id: poiId },
        data: { photoUrls: { push: url } },
      });
    }

    res.json({ url });
  } catch (err) {
    req.log?.error({ err }, "Failed to upload POI photo");
    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});
