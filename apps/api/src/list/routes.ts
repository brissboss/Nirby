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
