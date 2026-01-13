import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../auth/middleware";
import { prisma } from "../db";
import { POI_CATEGORIES, SUPPORTED_LANGUAGES } from "../types";
import { ErrorCodes } from "../utils/error-codes";
import { formatError, handleZodError } from "../utils/errors";

export const poiRouter = Router();

const openingHoursPeriodSchema = z.object({
  open: z.object({
    day: z.number().min(0).max(6),
    hour: z.number().min(0).max(23),
    minute: z.number().min(0).max(59),
  }),
  close: z.object({
    day: z.number().min(0).max(6),
    hour: z.number().min(0).max(23),
    minute: z.number().min(0).max(59),
  }),
});

const createPoiSchema = z.object({
  name: z
    .string({ required_error: ErrorCodes.POI_NAME_REQUIRED })
    .min(1, ErrorCodes.POI_NAME_REQUIRED)
    .max(255, ErrorCodes.POI_NAME_TOO_LONG),
  description: z.string().max(1000, ErrorCodes.POI_DESCRIPTION_TOO_LONG).optional(),
  descriptionLang: z.enum(SUPPORTED_LANGUAGES).optional().default("fr"),
  address: z.string().max(500, ErrorCodes.POI_ADDRESS_TOO_LONG).optional(),
  latitude: z
    .number({ required_error: ErrorCodes.POI_LATITUDE_INVALID })
    .min(-90, ErrorCodes.POI_LATITUDE_INVALID)
    .max(90, ErrorCodes.POI_LATITUDE_INVALID),
  longitude: z
    .number({ required_error: ErrorCodes.POI_LONGITUDE_INVALID })
    .min(-180, ErrorCodes.POI_LONGITUDE_INVALID)
    .max(180, ErrorCodes.POI_LONGITUDE_INVALID),
  visibility: z.enum(["PRIVATE", "SHARED", "PUBLIC"]).optional().default("PRIVATE"),
  category: z.enum(POI_CATEGORIES).optional(),
  website: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val))
    .refine((val) => !val || /^https?:\/\/.+/.test(val), { message: "Invalid url" }),
  phone: z
    .string()
    .max(50)
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  priceLevel: z.number().min(0).max(4).optional(),
  openingHours: z.array(openingHoursPeriodSchema).optional(),
  photoUrls: z
    .array(z.string())
    .optional()
    .transform((arr) => arr?.filter((url) => url !== "") ?? [])
    .refine((arr) => arr.every((url) => /^https?:\/\/.+/.test(url)), { message: "Invalid url" }),
});

const updatePoiSchema = z.object({
  name: z
    .string()
    .min(1, ErrorCodes.POI_NAME_REQUIRED)
    .max(255, ErrorCodes.POI_NAME_TOO_LONG)
    .optional(),
  description: z.string().max(1000, ErrorCodes.POI_DESCRIPTION_TOO_LONG).optional(),
  descriptionLang: z.enum(SUPPORTED_LANGUAGES).optional(),
  address: z.string().max(500, ErrorCodes.POI_ADDRESS_TOO_LONG).optional(),
  latitude: z
    .number()
    .min(-90, ErrorCodes.POI_LATITUDE_INVALID)
    .max(90, ErrorCodes.POI_LATITUDE_INVALID)
    .optional(),
  longitude: z
    .number()
    .min(-180, ErrorCodes.POI_LONGITUDE_INVALID)
    .max(180, ErrorCodes.POI_LONGITUDE_INVALID)
    .optional(),
  visibility: z.enum(["PRIVATE", "SHARED", "PUBLIC"]).optional(),
  category: z.enum(POI_CATEGORIES).optional(),
  website: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val))
    .refine((val) => !val || /^https?:\/\/.+/.test(val), { message: "Invalid url" }),
  phone: z
    .string()
    .max(50)
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  priceLevel: z.number().min(0).max(4).optional(),
  openingHours: z.array(openingHoursPeriodSchema).optional(),
  photoUrls: z
    .array(z.string())
    .optional()
    .transform((arr) => arr?.filter((url) => url !== "") ?? [])
    .refine((arr) => arr.every((url) => /^https?:\/\/.+/.test(url)), { message: "Invalid url" }),
});

/**
 * @openapi
 * /poi:
 *   post:
 *     summary: Create a new POI
 *     description: Creates a custom POI for the authenticated user
 *     tags:
 *       - 📌 POI
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
 *                 maxLength: 255
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               descriptionLang:
 *                 type: string
 *                 enum: [fr, en]
 *                 default: fr
 *               address:
 *                 type: string
 *                 maxLength: 500
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *               visibility:
 *                 type: string
 *                 enum: [PRIVATE, SHARED, PUBLIC]
 *                 default: PRIVATE
 *               category:
 *                 type: string
 *                 description: POI category (e.g., restaurant, museum)
 *               website:
 *                 type: string
 *                 format: uri
 *               phone:
 *                 type: string
 *                 maxLength: 50
 *               priceLevel:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 4
 *               openingHours:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     open:
 *                       type: object
 *                       properties:
 *                         day:
 *                           type: integer
 *                           minimum: 0
 *                           maximum: 6
 *                         hour:
 *                           type: integer
 *                           minimum: 0
 *                           maximum: 23
 *                         minute:
 *                           type: integer
 *                           minimum: 0
 *                           maximum: 59
 *                     close:
 *                       type: object
 *                       properties:
 *                         day:
 *                           type: integer
 *                           minimum: 0
 *                           maximum: 6
 *                         hour:
 *                           type: integer
 *                           minimum: 0
 *                           maximum: 23
 *                         minute:
 *                           type: integer
 *                           minimum: 0
 *                           maximum: 59
 *               photoUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *             required:
 *               - name
 *               - latitude
 *               - longitude
 *     responses:
 *       201:
 *         description: POI created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
poiRouter.post("/", requireAuth, async (req, res) => {
  try {
    const data = createPoiSchema.parse(req.body);

    const poi = await prisma.poi.create({
      data: {
        name: data.name,
        description: data.description,
        descriptionLang: data.descriptionLang as string | undefined,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        visibility: data.visibility,
        category: data.category as string | undefined,
        website: data.website,
        phone: data.phone,
        priceLevel: data.priceLevel,
        openingHours: data.openingHours,
        photoUrls: data.photoUrls ?? [],
        createdBy: req.user!.id,
      },
    });

    res.status(201).json({
      message: "POI created successfully",
      poi,
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
 * /poi:
 *   get:
 *     summary: List user's POIs
 *     description: Returns all POIs created by the authenticated user with pagination
 *     tags:
 *       - 📌 POI
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of POIs with pagination info
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
poiRouter.get("/", requireAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [pois, total] = await Promise.all([
      prisma.poi.findMany({
        where: {
          createdBy: req.user!.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.poi.count({
        where: {
          createdBy: req.user!.id,
        },
      }),
    ]);

    res.json({
      pois,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    req.log?.error({ err });
    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});

/**
 * @openapi
 * /poi/{id}:
 *   get:
 *     summary: Get a POI by ID
 *     description: Returns a specific POI if the user has access to it
 *     tags:
 *       - 📌 POI
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: POI ID
 *     responses:
 *       200:
 *         description: POI found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: POI not found
 *       500:
 *         description: Internal server error
 */
poiRouter.get("/:id", requireAuth, async (req, res) => {
  try {
    const poi = await prisma.poi.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!poi) {
      return res.status(404).json(formatError(ErrorCodes.POI_NOT_FOUND, "POI not found"));
    }

    if (poi.createdBy !== req.user!.id && poi.visibility !== "PUBLIC") {
      return res.status(403).json(formatError(ErrorCodes.POI_ACCESS_DENIED, "Access denied"));
    }

    res.json(poi);
  } catch (err) {
    req.log?.error({ err });
    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});

/**
 * @openapi
 * /poi/{id}:
 *   put:
 *     summary: Update a POI
 *     description: Updates a POI owned by the authenticated user
 *     tags:
 *       - 📌 POI
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: POI ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               descriptionLang:
 *                 type: string
 *                 enum: [fr, en]
 *               address:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               visibility:
 *                 type: string
 *                 enum: [PRIVATE, SHARED, PUBLIC]
 *               category:
 *                 type: string
 *               website:
 *                 type: string
 *                 format: uri
 *               phone:
 *                 type: string
 *               priceLevel:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 4
 *               openingHours:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     open:
 *                       type: object
 *                       properties:
 *                         day:
 *                           type: integer
 *                           minimum: 0
 *                           maximum: 6
 *                         hour:
 *                           type: integer
 *                           minimum: 0
 *                           maximum: 23
 *                         minute:
 *                           type: integer
 *                           minimum: 0
 *                           maximum: 59
 *                     close:
 *                       type: object
 *                       properties:
 *                         day:
 *                           type: integer
 *                           minimum: 0
 *                           maximum: 6
 *                         hour:
 *                           type: integer
 *                           minimum: 0
 *                           maximum: 23
 *                         minute:
 *                           type: integer
 *                           minimum: 0
 *                           maximum: 59
 *               photoUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *     responses:
 *       200:
 *         description: POI updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: POI not found
 *       500:
 *         description: Internal server error
 */
poiRouter.put("/:id", requireAuth, async (req, res) => {
  try {
    const poi = await prisma.poi.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!poi) {
      return res.status(404).json(formatError(ErrorCodes.POI_NOT_FOUND, "POI not found"));
    }

    if (poi.createdBy !== req.user!.id) {
      return res.status(403).json(formatError(ErrorCodes.POI_ACCESS_DENIED, "Access denied"));
    }

    const data = updatePoiSchema.parse(req.body);

    const updatedPoi = await prisma.poi.update({
      where: { id: req.params.id },
      data: {
        ...data,
        descriptionLang: data.descriptionLang as string | undefined,
        category: data.category as string | undefined,
      },
    });

    res.json({ message: "POI updated successfully", poi: updatedPoi });
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
 * /poi/{id}:
 *   delete:
 *     summary: Delete a POI
 *     description: Deletes a POI owned by the authenticated user
 *     tags:
 *       - 📌 POI
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: POI ID
 *     responses:
 *       200:
 *         description: POI deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: POI not found
 *       500:
 *         description: Internal server error
 */
poiRouter.delete("/:id", requireAuth, async (req, res) => {
  try {
    const poi = await prisma.poi.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!poi) {
      return res.status(404).json(formatError(ErrorCodes.POI_NOT_FOUND, "POI not found"));
    }

    if (poi.createdBy !== req.user!.id) {
      return res.status(403).json(formatError(ErrorCodes.POI_ACCESS_DENIED, "Access denied"));
    }

    await prisma.poi.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "POI deleted successfully" });
  } catch (err) {
    req.log?.error({ err });
    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});
