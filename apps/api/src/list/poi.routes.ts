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

/**
 * @openapi
 * /list/{listId}/poi:
 *   post:
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
 *       400:
 *         description: Invalid input or POI already in list
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: List not found
 *       500:
 *         description: Internal server error
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

    res.status(201).json({ message: "POI added to list successfully", savedPoi });
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: List not found
 *       500:
 *         description: Internal server error
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
 * /list/{listId}/poi/{savedPoiId}:
 *   delete:
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: List or saved POI not found
 *       500:
 *         description: Internal server error
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
