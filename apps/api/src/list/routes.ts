import { CollaboratorRole, PoiVisibility } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../auth/middleware";
import { prisma } from "../db";
import { ErrorCodes } from "../utils/error-codes";
import { formatError, handleZodError } from "../utils/errors";

import { checkListAccess } from "./utils";

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
 *     operationId: createList
 *     summary: Create a new list
 *     description: Creates a POI list for the authenticated user
 *     tags:
 *       - Core
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateListResponse'
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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

    res.status(201).json({ list });
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
 *     operationId: getLists
 *     summary: Get user's lists
 *     description: Returns paginated lists for the authenticated user
 *     tags:
 *       - Core
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
 *       - in: query
 *         name: roles
 *         description: Filter lists by collaborator role
 *         schema:
 *           type: array
 *           default: [OWNER, EDITOR, VIEWER, ADMIN]
 *           items:
 *             type: string
 *           enum: [OWNER, EDITOR, VIEWER, ADMIN]
 *     responses:
 *       200:
 *         description: Lists retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetListsResponse'
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
listRouter.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const roleFilter = req.query.roles;
    const roles = roleFilter
      ? Array.isArray(roleFilter)
        ? roleFilter.map((r) => r.toString().trim())
        : roleFilter
            .toString()
            .split(",")
            .map((r) => r.trim())
      : ["OWNER", "EDITOR", "VIEWER", "ADMIN"];

    const conditions = [];

    if (roles.includes("OWNER")) {
      conditions.push({ createdBy: userId });
    }

    const collabRoles = roles.filter(
      (r) => typeof r === "string" && ["EDITOR", "VIEWER", "ADMIN"].includes(r)
    );
    if (collabRoles.length > 0) {
      conditions.push({
        collaborators: { some: { userId, role: { in: collabRoles as CollaboratorRole[] } } },
      });
    }

    const [lists, total] = await Promise.all([
      prisma.poiList.findMany({
        where: {
          OR: conditions.length > 0 ? conditions : [{ id: "impossible" }],
        },
        include: {
          collaborators: {
            where: { userId },
            select: { role: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.poiList.count({
        where: {
          OR: conditions.length > 0 ? conditions : [{ id: "impossible" }],
        },
      }),
    ]);

    const listsWithRole = lists.map((list) => {
      const { collaborators, ...rest } = list;

      return {
        ...rest,
        role: list.createdBy === userId ? "OWNER" : collaborators[0]?.role,
      };
    });

    res.json({
      lists: listsWithRole,
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
 * /list/{listId}:
 *   get:
 *     operationId: getListById
 *     summary: Get a list by ID
 *     description: Returns a specific list
 *     tags:
 *       - Core
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
 *         description: List retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetListResponse'
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
listRouter.get("/:listId", requireAuth, async (req, res) => {
  try {
    const list = await prisma.poiList.findUnique({ where: { id: req.params.listId } });
    if (!list) {
      return res.status(404).json(formatError(ErrorCodes.LIST_NOT_FOUND, "List not found"));
    }

    const role = await checkListAccess(list, req.user!.id);

    if (!role) {
      return res.status(404).json(formatError(ErrorCodes.LIST_NOT_FOUND, "List not found"));
    }

    res.json({ list });
  } catch (err) {
    req.log?.error({ err }, "Failed to get list");
    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});

/**
 * @openapi
 * /list/{listId}:
 *   put:
 *     operationId: updateList
 *     summary: Update a list
 *     description: Updates a list owned by the authenticated user
 *     tags:
 *       - Core
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateListResponse'
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
listRouter.put("/:listId", requireAuth, async (req, res) => {
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

    const data = updateListSchema.parse(req.body);

    const updatedList = await prisma.poiList.update({
      where: { id: list.id },
      data,
    });

    res.json({ list: updatedList });
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
 * /list/{listId}:
 *   delete:
 *     operationId: deleteList
 *     summary: Delete a list
 *     description: Deletes a list owned by the authenticated user
 *     tags:
 *       - Core
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
 *         description: List deleted successfully
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
listRouter.delete("/:listId", requireAuth, async (req, res) => {
  try {
    const list = await prisma.poiList.findUnique({ where: { id: req.params.listId } });
    if (!list) {
      return res.status(404).json(formatError(ErrorCodes.LIST_NOT_FOUND, "List not found"));
    }

    const role = await checkListAccess(list, req.user!.id);

    if (!role) {
      return res.status(404).json(formatError(ErrorCodes.LIST_NOT_FOUND, "List not found"));
    }

    if (!["ADMIN", "OWNER"].includes(role)) {
      return res.status(403).json(formatError(ErrorCodes.LIST_ACCESS_DENIED, "Access denied"));
    }

    await prisma.poiList.delete({ where: { id: list.id } });

    res.json({ message: "List deleted successfully" });
  } catch (err) {
    req.log?.error({ err }, "Failed to delete list");
    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});
