import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../auth/middleware";
import { prisma } from "../db";
import { ErrorCodes } from "../utils/error-codes";
import { formatError, handleZodError } from "../utils/errors";

import { checkListAccess } from "./utils";

export const listPoiRouter = Router();

const addPoiToListSchema = z
  .object({
    poiId: z.string().optional(),
    googlePlaceId: z.string().optional(),
  })
  .refine((data) => data.poiId || data.googlePlaceId, {
    message: ErrorCodes.POI_OR_GOOGLE_PLACE_REQUIRED,
  })
  .refine((data) => !(data.poiId && data.googlePlaceId), {
    message: "Cannot specify both poiId and googlePlaceId",
  });

const nearbyPoiSchema = z.object({
  latitude: z.coerce
    .number()
    .min(-90, ErrorCodes.POI_LATITUDE_INVALID)
    .max(90, ErrorCodes.POI_LATITUDE_INVALID),
  longitude: z.coerce
    .number()
    .min(-180, ErrorCodes.POI_LONGITUDE_INVALID)
    .max(180, ErrorCodes.POI_LONGITUDE_INVALID),
  radius: z.coerce
    .number()
    .min(1, ErrorCodes.POI_RADIUS_INVALID)
    .max(50000, ErrorCodes.POI_RADIUS_INVALID)
    .default(1000),
});

/**
 * @openapi
 * /list/{listId}/poi:
 *   post:
 *     operationId: addPoiToList
 *     summary: Add a POI to a list
 *     description: Adds a custom POI or Google Place to a list
 *     tags:
 *       - POI
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               poiId:
 *                 type: string
 *               googlePlaceId:
 *                 type: string
 *     responses:
 *       201:
 *         description: POI added to list successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SavedPoiBasicResponse'
 *       400:
 *         description: Invalid input or POI already in list
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
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: List not found
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
listPoiRouter.post("/:listId/poi", requireAuth, async (req, res) => {
  try {
    const list = await prisma.poiList.findUnique({ where: { id: req.params.listId } });
    if (!list) {
      return res.status(404).json(formatError(ErrorCodes.LIST_NOT_FOUND, "List not found"));
    }

    const role = await checkListAccess(list, req.user!.id);

    if (!role) {
      return res.status(404).json(formatError(ErrorCodes.LIST_NOT_FOUND, "List not found"));
    }

    if (!["EDITOR", "ADMIN", "OWNER"].includes(role)) {
      return res.status(403).json(formatError(ErrorCodes.LIST_ACCESS_DENIED, "Access denied"));
    }

    const data = addPoiToListSchema.parse(req.body);

    if (data.poiId) {
      const poi = await prisma.poi.findUnique({ where: { id: data.poiId } });
      if (!poi) {
        return res.status(404).json(formatError(ErrorCodes.POI_NOT_FOUND, "POI not found"));
      }
    }

    if (data.googlePlaceId) {
      const cachedPlace = await prisma.googlePlaceCache.findUnique({
        where: { placeId: data.googlePlaceId },
      });
      if (!cachedPlace) {
        return res
          .status(404)
          .json(formatError(ErrorCodes.GOOGLE_PLACE_NOT_FOUND, "Google Place not found in cache"));
      }
    }

    const existing = await prisma.savedPoi.findFirst({
      where: {
        listId: list.id,
        ...(data.poiId ? { poiId: data.poiId } : { googlePlaceId: data.googlePlaceId }),
      },
    });

    if (existing) {
      return res.status(400).json(formatError(ErrorCodes.POI_ALREADY_SAVED, "POI already in list"));
    }

    const savedPoi = await prisma.savedPoi.create({
      data: {
        listId: list.id,
        poiId: data.poiId,
        googlePlaceId: data.googlePlaceId,
      },
    });

    res.status(201).json({ savedPoi });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const details = handleZodError(err);
      return res
        .status(400)
        .json(formatError(ErrorCodes.VALIDATION_ERROR, "Invalid input", details));
    }
    req.log?.error({ err }, "Failed to add POI to list");
    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});

/**
 * @openapi
 * /list/{listId}/pois:
 *   get:
 *     operationId: getListPois
 *     summary: Get POIs in a list
 *     description: Returns all POIs saved in a list
 *     tags:
 *       - POI
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: POIs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetSavedPoisResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: List not found
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
listPoiRouter.get("/:listId/pois", requireAuth, async (req, res) => {
  try {
    const list = await prisma.poiList.findUnique({ where: { id: req.params.listId } });
    if (!list) {
      return res.status(404).json(formatError(ErrorCodes.LIST_NOT_FOUND, "List not found"));
    }

    const role = await checkListAccess(list, req.user!.id);

    if (!role) {
      return res.status(404).json(formatError(ErrorCodes.LIST_NOT_FOUND, "List not found"));
    }

    const savedPois = await prisma.savedPoi.findMany({
      where: { listId: list.id },
      include: { poi: true, googlePlaceCache: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({ savedPois });
  } catch (err) {
    req.log?.error({ err }, "Failed to get POIs in list");
    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});

/**
 * @openapi
 * /list/{listId}/poi/nearby:
 *   get:
 *     operationId: getNearbyListPois
 *     summary: Get nearby POIs in a list
 *     description: Returns nearby POIs within a specified radius
 *     tags:
 *       - POI
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude
 *       - in: query
 *         name: radius
 *         required: false
 *         schema:
 *           type: number
 *           default: 1000
 *         description: "Radius in meters (default: 1000)"
 *     responses:
 *       200:
 *         description: Nearby POIs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NearbyPOIsResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: List not found
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
listPoiRouter.get("/:listId/poi/nearby", requireAuth, async (req, res) => {
  try {
    const data = nearbyPoiSchema.parse(req.query);

    const list = await prisma.poiList.findUnique({ where: { id: req.params.listId } });
    if (!list) {
      return res.status(404).json(formatError(ErrorCodes.LIST_NOT_FOUND, "List not found"));
    }

    const role = await checkListAccess(list, req.user!.id);

    if (!role) {
      return res.status(404).json(formatError(ErrorCodes.LIST_NOT_FOUND, "List not found"));
    }

    if (!["EDITOR", "ADMIN", "OWNER", "VIEWER"].includes(role)) {
      return res.status(403).json(formatError(ErrorCodes.LIST_ACCESS_DENIED, "Access denied"));
    }

    const results = (await prisma.$queryRaw`
      SELECT 
        sp.id as "savedPoiId",
        sp."listId",
        sp."poiId",
        sp."googlePlaceId",
        sp."createdAt",
        COALESCE(p.name, g.name) as name,
        COALESCE(p.address, g.address) as address,
        COALESCE(p.latitude, g.latitude) as latitude,
        COALESCE(p.longitude, g.longitude) as longitude,
        COALESCE(p.category, g.category) as category,
        ST_Distance(
          COALESCE(p.location, g.location)::geography,
          ST_SetSRID(ST_MakePoint(${data.longitude}, ${data.latitude}), 4326)::geography
        )::float as distance
      FROM "SavedPoi" sp
      LEFT JOIN "Poi" p ON sp."poiId" = p.id
      LEFT JOIN "GooglePlaceCache" g ON sp."googlePlaceId" = g."placeId"
      WHERE 
        sp."listId" = ${list.id}
        AND COALESCE(p.location, g.location) IS NOT NULL
        AND ST_DWithin(
          COALESCE(p.location, g.location)::geography,
          ST_SetSRID(ST_MakePoint(${data.longitude}, ${data.latitude}), 4326)::geography,
          ${data.radius}
        )
      ORDER BY distance ASC
    `) as Array<{
      savedPoiId: string;
      listId: string;
      poiId: string | null;
      googlePlaceId: string | null;
      createdAt: Date;
      name: string;
      address: string | null;
      latitude: number;
      longitude: number;
      category: string | null;
      distance: number;
    }>;

    res.json({ pois: results });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const details = handleZodError(err);
      return res
        .status(400)
        .json(formatError(ErrorCodes.VALIDATION_ERROR, "Invalid input", details));
    }
    req.log?.error({ err }, "Failed to get nearby POIs in list");
    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});

/**
 * @openapi
 * /list/{listId}/poi/{savedPoiId}:
 *   delete:
 *     operationId: removePoiFromList
 *     summary: Remove a POI from a list
 *     description: Removes a saved POI from a list
 *     tags:
 *       - POI
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: savedPoiId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: POI removed from list successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SingleMessageResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: List or saved POI not found
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
listPoiRouter.delete("/:listId/poi/:savedPoiId", requireAuth, async (req, res) => {
  try {
    const list = await prisma.poiList.findUnique({ where: { id: req.params.listId } });
    if (!list) {
      return res.status(404).json(formatError(ErrorCodes.LIST_NOT_FOUND, "List not found"));
    }

    const role = await checkListAccess(list, req.user!.id);

    if (!role) {
      return res.status(404).json(formatError(ErrorCodes.LIST_NOT_FOUND, "List not found"));
    }

    if (!["EDITOR", "ADMIN", "OWNER"].includes(role)) {
      return res.status(403).json(formatError(ErrorCodes.LIST_ACCESS_DENIED, "Access denied"));
    }

    const savedPoi = await prisma.savedPoi.findUnique({ where: { id: req.params.savedPoiId } });

    if (!savedPoi || savedPoi.listId !== list.id) {
      return res
        .status(404)
        .json(formatError(ErrorCodes.SAVED_POI_NOT_FOUND, "Saved POI not found"));
    }

    await prisma.savedPoi.delete({ where: { id: req.params.savedPoiId } });

    res.json({ message: "POI removed from list successfully" });
  } catch (err) {
    req.log?.error({ err }, "Failed to remove POI from list");
    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});
