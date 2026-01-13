import { PoiVisibility } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../auth/middleware";
import { prisma } from "../db";
import { ErrorCodes } from "../utils/error-codes";
import { formatError, handleZodError } from "../utils/errors";

export const listRouter = Router();

const createListSchema = z.object({
  name: z
    .string({ required_error: ErrorCodes.LIST_NAME_REQUIRED })
    .min(1, ErrorCodes.LIST_NAME_REQUIRED)
    .max(255, ErrorCodes.LIST_NAME_TOO_LONG),
  description: z.string().max(1000, ErrorCodes.LIST_DESCRIPTION_TOO_LONG).optional(),
  imageUrl: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val))
    .refine((val) => !val || /^https?:\/\/.+/.test(val), { message: "Invalid url" }),
  visibility: z.enum(["PRIVATE", "SHARED", "PUBLIC"]).optional().default("PRIVATE"),
});

const updateListSchema = z.object({
  name: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val))
    .refine((val) => !val || val.length >= 1, { message: ErrorCodes.LIST_NAME_REQUIRED })
    .refine((val) => !val || val.length <= 255, { message: ErrorCodes.LIST_NAME_TOO_LONG }),
  description: z
    .string()
    .max(1000, ErrorCodes.LIST_DESCRIPTION_TOO_LONG)
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  imageUrl: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val))
    .refine((val) => !val || /^https?:\/\/.+/.test(val), { message: "Invalid url" }),
  visibility: z.enum(["PRIVATE", "SHARED", "PUBLIC"]).optional(),
});

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
 * /list:
 *   post:
 *     summary: Create a new list
 *     description: Creates a POI list for the authenticated user
 *     tags:
 *       - List
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *               visibility:
 *                 type: string
 *                 enum: [PRIVATE, SHARED, PUBLIC]
 *     responses:
 *       201:
 *         description: List created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
listRouter.post("/", requireAuth, async (req, res) => {
  try {
    const data = createListSchema.parse(req.body);

    const list = await prisma.poiList.create({
      data: {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        visibility: data.visibility as PoiVisibility,
        createdBy: req.user!.id,
      },
    });

    res.status(201).json({ message: "List created successfully", list });
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
 * /list:
 *   get:
 *     summary: Get user's lists
 *     description: Returns paginated lists for the authenticated user
 *     tags:
 *       - List
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Lists retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
listRouter.get("/", requireAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [lists, total] = await Promise.all([
      prisma.poiList.findMany({
        where: { createdBy: req.user!.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.poiList.count({ where: { createdBy: req.user!.id } }),
    ]);

    res.json({
      lists,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    req.log?.error({ err }, "Failed to get lists");
    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});

/**
 * @openapi
 * /list/{id}:
 *   get:
 *     summary: Get a list by ID
 *     description: Returns a specific list
 *     tags:
 *       - List
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: List not found
 *       500:
 *         description: Internal server error
 */
listRouter.get("/:id", requireAuth, async (req, res) => {
  try {
    const list = await prisma.poiList.findUnique({ where: { id: req.params.id } });

    if (!list) {
      return res.status(404).json(formatError(ErrorCodes.LIST_NOT_FOUND, "List not found"));
    }

    if (list.createdBy !== req.user!.id && list.visibility !== "PRIVATE") {
      return res.status(403).json(formatError(ErrorCodes.LIST_ACCESS_DENIED, "Access denied"));
    }

    res.json({ list });
  } catch (err) {
    req.log?.error({ err }, "Failed to get list");
    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});

/**
 * @openapi
 * /list/{id}:
 *   put:
 *     summary: Update a list
 *     description: Updates a list owned by the authenticated user
 *     tags:
 *       - List
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *               visibility:
 *                 type: string
 *                 enum: [PRIVATE, SHARED, PUBLIC]
 *     responses:
 *       200:
 *         description: List updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: List not found
 *       500:
 *         description: Internal server error
 */
listRouter.put("/:id", requireAuth, async (req, res) => {
  try {
    const list = await prisma.poiList.findUnique({ where: { id: req.params.id } });

    if (!list) {
      return res.status(404).json(formatError(ErrorCodes.LIST_NOT_FOUND, "List not found"));
    }

    if (list.createdBy !== req.user!.id) {
      return res.status(403).json(formatError(ErrorCodes.LIST_ACCESS_DENIED, "Access denied"));
    }

    const data = updateListSchema.parse(req.body);

    const updatedList = await prisma.poiList.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ message: "List updated successfully", list: updatedList });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const details = handleZodError(err);
      return res
        .status(400)
        .json(formatError(ErrorCodes.VALIDATION_ERROR, "Invalid input", details));
    }
    req.log?.error({ err }, "Failed to update list");
    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});

/**
 * @openapi
 * /list/{id}:
 *   delete:
 *     summary: Delete a list
 *     description: Deletes a list owned by the authenticated user
 *     tags:
 *       - List
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: List not found
 *       500:
 *         description: Internal server error
 */
listRouter.delete("/:id", requireAuth, async (req, res) => {
  try {
    const list = await prisma.poiList.findUnique({ where: { id: req.params.id } });

    if (!list) {
      return res.status(404).json(formatError(ErrorCodes.LIST_NOT_FOUND, "List not found"));
    }

    if (list.createdBy !== req.user!.id) {
      return res.status(403).json(formatError(ErrorCodes.LIST_ACCESS_DENIED, "Access denied"));
    }

    await prisma.poiList.delete({ where: { id: req.params.id } });

    res.json({ message: "List deleted successfully" });
  } catch (err) {
    req.log?.error({ err }, "Failed to delete list");
    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});

/**
 * @openapi
 * /list/{listId}/poi:
 *   post:
 *     summary: Add a POI to a list
 *     description: Adds a custom POI or Google Place to a list
 *     tags:
 *       - List
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
listRouter.post("/:listId/poi", requireAuth, async (req, res) => {
  try {
    const list = await prisma.poiList.findUnique({ where: { id: req.params.listId } });

    if (!list) {
      return res.status(404).json(formatError(ErrorCodes.LIST_NOT_FOUND, "List not found"));
    }

    if (list.createdBy !== req.user!.id) {
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
        listId: req.params.listId,
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
 *       - List
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
listRouter.get("/:listId/pois", requireAuth, async (req, res) => {
  try {
    const list = await prisma.poiList.findUnique({ where: { id: req.params.listId } });

    if (!list) {
      return res.status(404).json(formatError(ErrorCodes.LIST_NOT_FOUND, "List not found"));
    }

    if (list.createdBy !== req.user!.id && list.visibility !== "PRIVATE") {
      return res.status(403).json(formatError(ErrorCodes.LIST_ACCESS_DENIED, "Access denied"));
    }

    const savedPois = await prisma.savedPoi.findMany({
      where: { listId: req.params.listId },
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
 *       - List
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
listRouter.delete("/:listId/poi/:savedPoiId", requireAuth, async (req, res) => {
  try {
    const list = await prisma.poiList.findUnique({ where: { id: req.params.listId } });

    if (!list) {
      return res.status(404).json(formatError(ErrorCodes.LIST_NOT_FOUND, "List not found"));
    }

    if (list.createdBy !== req.user!.id) {
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
