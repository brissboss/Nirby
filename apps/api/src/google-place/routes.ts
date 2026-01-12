import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../auth/middleware";
import { prisma } from "../db";
import { POI_CATEGORIES, SUPPORTED_LANGUAGES } from "../types";
import { ErrorCodes } from "../utils/error-codes";
import { formatError, handleZodError } from "../utils/errors";

export const googlePlaceRouter = Router();

/**
 * @openapi
 * /google-place/{placeId}:
 *   get:
 *     summary: Get a Google Place from cache
 *     description: Returns cached Google Place data by placeId
 *     tags:
 *       - Google Places
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: placeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Google Place ID
 *     responses:
 *       200:
 *         description: Google Place found
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Google Place not found in cache
 *       500:
 *         description: Internal server error
 */
googlePlaceRouter.get("/:placeId", requireAuth, async (req, res) => {
  try {
    const { placeId } = req.params;

    if (!placeId || placeId.trim() === "") {
      return res
        .status(400)
        .json(formatError(ErrorCodes.GOOGLE_PLACE_INVALID_ID, "Invalid Place ID"));
    }

    const cachedPlace = await prisma.googlePlaceCache.findUnique({ where: { placeId } });

    if (!cachedPlace) {
      // TODO: Fetch from Google Places API
      return res
        .status(404)
        .json(formatError(ErrorCodes.GOOGLE_PLACE_NOT_FOUND, "Google Place not found in cache"));
    }

    if (cachedPlace.expiresAt && new Date() > cachedPlace.expiresAt) {
      // TODO: Refresh cache
      return res
        .status(404)
        .json(formatError(ErrorCodes.GOOGLE_PLACE_NOT_FOUND, "Google Place not found in cache"));
    }

    res.json(cachedPlace);
  } catch (err) {
    req.log?.error({ err }, "Failed to get Google Place from cache");
    return res
      .status(500)
      .json(
        formatError(ErrorCodes.GOOGLE_PLACE_FETCH_ERROR, "Failed to get Google Place from cache")
      );
  }
});
