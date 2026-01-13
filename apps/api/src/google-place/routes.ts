import { Router } from "express";
import z from "zod";

import { requireAuth } from "../auth/middleware";
import { searchRateLimiter, getPlaceRateLimiter, photoRateLimiter } from "../middleware/rate-limit";
import { SUPPORTED_LANGUAGES } from "../types";
import { ErrorCode, ErrorCodes } from "../utils/error-codes";
import { ApiError, formatError, handleZodError } from "../utils/errors";

import { getOrFetchPlace, searchPlaces, getPhoto } from "./service";

export const googlePlaceRouter = Router();

const searchPlacesSchema = z.object({
  searchQuery: z.string().min(1),
  language: z.enum(SUPPORTED_LANGUAGES).optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
});

const getPhotoSchema = z.object({
  ref: z.string().min(1),
  maxWidth: z.coerce.number().optional().default(400),
});

const getPlaceParamsSchema = z.object({
  placeId: z
    .string()
    .min(1)
    .refine((val) => val.trim().length > 0, {
      message: "Place ID cannot be empty or whitespace",
    }),
});

const getPlaceQuerySchema = z.object({
  language: z.enum(SUPPORTED_LANGUAGES).optional(),
});

/**
 * @openapi
 * /google-place/search:
 *   post:
 *     summary: Search for Google Places
 *     description: Searches for Google Places using the Google Places API
 *     tags:
 *       - 🌍 Google Places
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               searchQuery:
 *                 type: string
 *                 required: true
 *                 description: The search query to use
 *               language:
 *                 type: string
 *                 enum: [fr, en]
 *                 required: false
 *                 default: en
 *                 description: The language to use for the search
 *               lat:
 *                 type: number
 *                 required: false
 *                 description: The latitude to use for the search
 *               lng:
 *                 type: number
 *                 required: false
 *                 description: The longitude to use for the search
 *     responses:
 *       200:
 *         description: Google Places found
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid input
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
googlePlaceRouter.post("/search", requireAuth, searchRateLimiter, async (req, res) => {
  try {
    const { searchQuery, language, lat, lng } = searchPlacesSchema.parse(req.body);

    const places = await searchPlaces(searchQuery, language, lat && lng ? { lat, lng } : undefined);

    res.json(places);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json(formatError(ErrorCodes.VALIDATION_ERROR, "Invalid input", handleZodError(err)));
    }
    if (err instanceof ApiError) {
      return res.status(err.statusCode).json(formatError(err.code as ErrorCode, err.message));
    }
    req.log?.error({ err }, "Failed to search for Google Places");
    return res
      .status(500)
      .json(
        formatError(ErrorCodes.GOOGLE_PLACE_SEARCH_ERROR, "Failed to search for Google Places")
      );
  }
});

/**
 * @openapi
 * /google-place/photo:
 *   get:
 *     summary: Get a Google Place photo
 *     description: Gets a Google Place photo from the Google Places API
 *     tags:
 *       - 🌍 Google Places
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ref
 *         required: true
 *         schema:
 *           type: string
 *         description: The photo reference to use to fetch the photo
 *       - in: query
 *         name: maxWidth
 *         required: false
 *         schema:
 *           type: number
 *           default: 400
 *         description: The maximum width of the photo
 *     responses:
 *       200:
 *         description: Photo found
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid input
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
googlePlaceRouter.get("/photo", requireAuth, photoRateLimiter, async (req, res) => {
  try {
    const { ref, maxWidth } = getPhotoSchema.parse(req.query);

    const photoBuffer = await getPhoto(ref, maxWidth);

    res.set("Content-Type", "image/jpeg");
    res.set("Cache-Control", "public, max-age=86400");
    res.send(photoBuffer);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json(formatError(ErrorCodes.VALIDATION_ERROR, "Photo reference is required"));
    }
    if (err instanceof ApiError) {
      return res.status(err.statusCode).json(formatError(err.code as ErrorCode, err.message));
    }

    req.log?.error({ err }, "Failed to get Google Place photo");
    return res
      .status(500)
      .json(formatError(ErrorCodes.GOOGLE_PLACE_PHOTO_ERROR, "Failed to get Google Place photo"));
  }
});

/**
 * @openapi
 * /google-place/{placeId}:
 *   get:
 *     summary: Get a Google Place
 *     description: Returns cached Google Place data or fetches from Google API if not cached/expired
 *     tags:
 *       - 🌍 Google Places
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: placeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Google Place ID
 *       - in: query
 *         name: language
 *         required: false
 *         schema:
 *           type: string
 *           enum: [fr, en]
 *         description: Language code for fetching from Google API
 *     responses:
 *       200:
 *         description: Google Place found
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Google Place not found
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
googlePlaceRouter.get("/:placeId", requireAuth, getPlaceRateLimiter, async (req, res, next) => {
  try {
    const { placeId } = getPlaceParamsSchema.parse(req.params);
    const { language } = getPlaceQuerySchema.parse(req.query);

    const place = await getOrFetchPlace(placeId, language);
    res.json(place);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json(formatError(ErrorCodes.GOOGLE_PLACE_INVALID_ID, "Invalid Place ID"));
    }
    if (err instanceof ApiError) {
      return next(err);
    }

    req.log?.error({ err }, "Failed to get Google Place");
    return res
      .status(500)
      .json(formatError(ErrorCodes.GOOGLE_PLACE_FETCH_ERROR, "Failed to get Google Place"));
  }
});
