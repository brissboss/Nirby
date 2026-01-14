import crypto from "crypto";

import { CollaboratorRole, PoiList, PoiVisibility } from "@prisma/client";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";

import { requireAuth } from "../auth/middleware";
import { prisma } from "../db";
import { sendCollaboratorInviteEmail } from "../email/service";
import { env } from "../env";
import { SUPPORTED_LANGUAGES } from "../types";
import { ErrorCodes } from "../utils/error-codes";
import { formatError, handleZodError } from "../utils/errors";

export const listRouter = Router();

/**
 * Check user access to a list and return their role
 * @returns "OWNER" | "EDITOR" | "VIEWER" | "ADMIN" | null
 */
async function checkListAccess(
  list: PoiList,
  userId: string
): Promise<"OWNER" | "EDITOR" | "VIEWER" | "ADMIN" | null> {
  // Owner always has access
  if (list.createdBy === userId) {
    return "OWNER";
  }

  const collaborator = await prisma.listCollaborator.findUnique({
    where: { listId_userId: { listId: list.id, userId } },
  });

  if (collaborator) {
    return collaborator.role;
  }

  if (list.visibility === "PUBLIC") {
    return "VIEWER";
  }

  return null;
}

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

const inviteCollaboratorSchema = z.object({
  email: z
    .string({ required_error: ErrorCodes.EMAIL_REQUIRED })
    .email(ErrorCodes.INVALID_EMAIL)
    .max(255, ErrorCodes.EMAIL_TOO_LONG),
  role: z.enum(["EDITOR", "VIEWER", "ADMIN"]).optional().default("VIEWER"),
  language: z.enum(SUPPORTED_LANGUAGES).optional().default("en"),
  sendEmail: z.boolean().optional().default(true),
});

/**
 * @openapi
 * /list:
 *   post:
 *     summary: Create a new list
 *     description: Creates a POI list for the authenticated user
 *     tags:
 *       - 📝 List
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
 *       - 📝 List
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
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
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
 *     summary: Get a list by ID
 *     description: Returns a specific list
 *     tags:
 *       - 📝 List
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: List not found
 *       500:
 *         description: Internal server error
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
 *     summary: Update a list
 *     description: Updates a list owned by the authenticated user
 *     tags:
 *       - 📝 List
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
 * /list/{listId}:
 *   delete:
 *     summary: Delete a list
 *     description: Deletes a list owned by the authenticated user
 *     tags:
 *       - 📝 List
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: List not found
 *       500:
 *         description: Internal server error
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

/**
 * @openapi
 * /list/{listId}/poi:
 *   post:
 *     summary: Add a POI to a list
 *     description: Adds a custom POI or Google Place to a list
 *     tags:
 *       - 📝 List
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
 *       - 📝 List
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
 *       - 📝 List
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

/**
 * @openapi
 * /list/{listId}/share:
 *   post:
 *     summary: Share a list
 *     description: Shares a list with a user by generating a share link
 *     tags:
 *       - 📝 List
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
 *         description: List shared successfully
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
listRouter.post("/:listId/share", requireAuth, async (req, res) => {
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

    const shareToken = crypto.randomBytes(32).toString("hex");

    await prisma.poiList.update({
      where: { id: req.params.listId },
      data: {
        shareToken: shareToken,
        shareTokenExpiresAt: null, // No expiration
      },
    });

    const shareLink = `${env.FRONTEND_URL}/shared/${shareToken}`;

    res.json({ shareLink });
  } catch (err) {
    req.log?.error({ err }, "Failed to share list");
    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});

/**
 * @openapi
 * /list/{listId}/share:
 *   delete:
 *     summary: Unshare a list
 *     description: Unshares a list
 *     tags:
 *       - 📝 List
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
 *         description: List unshared successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: List not found
 *       500:
 *         description: Internal server error
 */
listRouter.delete("/:listId/share", requireAuth, async (req, res) => {
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

    await prisma.poiList.update({
      where: { id: req.params.listId },
      data: { shareToken: null, shareTokenExpiresAt: null },
    });

    res.json({ message: "List unshared successfully" });
  } catch (err) {
    req.log?.error({ err }, "Failed to unshare list");
    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});

/**
 * @openapi
 * /list/{listId}/edit-link:
 *   post:
 *     summary: Generate an edit link for a list
 *     description: Generates an edit link for a list
 *     tags:
 *       - 📝 List
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
 *         description: Edit link generated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: List not found
 */
listRouter.post("/:listId/edit-link", requireAuth, async (req, res) => {
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

    const editToken = crypto.randomBytes(32).toString("hex");

    await prisma.poiList.update({
      where: { id: req.params.listId },
      data: { editToken: editToken, editTokenExpiresAt: null },
    });

    const editLink = `${env.FRONTEND_URL}/list/${list.id}/join?editToken=${editToken}`;

    res.json({ editLink });
  } catch (err) {
    req.log?.error({ err }, "Failed to generate edit link");
    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});

/**
 * @openapi
 * /list/{listId}/edit-link:
 *   delete:
 *     summary: Revoke an edit link for a list
 *     description: Revokes an edit link for a list
 *     tags:
 *       - 📝 List
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
 *         description: Edit link revoked successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: List not found
 *       500:
 *         description: Internal server error
 */
listRouter.delete("/:listId/edit-link", requireAuth, async (req, res) => {
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

    await prisma.poiList.update({
      where: { id: list.id },
      data: { editToken: null, editTokenExpiresAt: null },
    });

    res.json({ message: "Edit link revoked successfully" });
  } catch (err) {
    req.log?.error({ err }, "Failed to revoke edit link");
    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});

/**
 * @openapi
 * /list/join:
 *   post:
 *     summary: Join a list using an edit link
 *     description: Joins a list using an edit link
 *     tags:
 *       - 📝 List
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: editToken
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List joined successfully
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
listRouter.post("/join", requireAuth, async (req, res) => {
  try {
    const editToken = req.query.editToken as string;

    if (!editToken) {
      return res.status(400).json(formatError(ErrorCodes.TOKEN_REQUIRED, "Edit token is required"));
    }

    const list = await prisma.poiList.findUnique({ where: { editToken } });

    if (!list) {
      return res.status(404).json(formatError(ErrorCodes.LIST_NOT_FOUND, "List not found"));
    }

    if (list.editTokenExpiresAt && list.editTokenExpiresAt < new Date()) {
      return res
        .status(400)
        .json(formatError(ErrorCodes.LIST_EDIT_TOKEN_EXPIRED, "Edit token expired"));
    }

    if (list.createdBy === req.user!.id) {
      return res.json({
        message: "You are the owner of this list.",
        list,
      });
    }

    const collaborator = await prisma.listCollaborator.findUnique({
      where: { listId_userId: { listId: list.id, userId: req.user!.id } },
    });
    if (collaborator) {
      return res.json({
        message: "You are already a collaborator of this list.",
        list,
      });
    }

    await prisma.listCollaborator.create({
      data: { listId: list.id, userId: req.user!.id, role: "EDITOR" },
    });

    res.json({
      message: "You are now a collaborator of this list. You can now edit the list.",
      list,
    });
  } catch (err) {
    req.log?.error({ err }, "Failed to join list");
    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});

/**
 * @openapi
 * /list/{listId}/collaborators:
 *   get:
 *     summary: Get the collaborators of a list
 *     description: Gets the collaborators of a list
 *     tags:
 *       - 📝 List
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
 *         description: Collaborators retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: List not found
 *       500:
 *         description: Internal server error
 */
listRouter.get("/:listId/collaborators", requireAuth, async (req, res) => {
  try {
    const list = await prisma.poiList.findUnique({ where: { id: req.params.listId } });
    if (!list) {
      return res.status(404).json(formatError(ErrorCodes.LIST_NOT_FOUND, "List not found"));
    }

    const role = await checkListAccess(list, req.user!.id);
    if (!role) {
      return res.status(404).json(formatError(ErrorCodes.LIST_NOT_FOUND, "List not found"));
    }

    const collaborators = await prisma.listCollaborator.findMany({
      where: { listId: list.id },
      select: {
        role: true,
        joinedAt: true,
        user: { select: { id: true, email: true, name: true, avatarUrl: true } },
      },
    });

    res.json({ collaborators });
  } catch (err) {
    req.log?.error({ err }, "Failed to get collaborators");
    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});

/**
 * @openapi
 * /list/{listId}/collaborators/me:
 *   delete:
 *     summary: Leave a list
 *     description: Leaves a list
 *     tags:
 *       - 📝 List
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
 *         description: List left successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: List not found
 *       500:
 *         description: Internal server error
 */
listRouter.delete("/:listId/collaborators/me", requireAuth, async (req, res) => {
  try {
    const list = await prisma.poiList.findUnique({ where: { id: req.params.listId } });
    if (!list) {
      return res.status(404).json(formatError(ErrorCodes.LIST_NOT_FOUND, "List not found"));
    }

    const role = await checkListAccess(list, req.user!.id);
    if (!role) {
      return res.status(404).json(formatError(ErrorCodes.LIST_NOT_FOUND, "List not found"));
    }

    if (role === "OWNER") {
      return res
        .status(400)
        .json(formatError(ErrorCodes.LIST_OWNER_CANNOT_LEAVE, "Owner cannot leave the list"));
    }

    await prisma.listCollaborator.delete({
      where: { listId_userId: { listId: list.id, userId: req.user!.id } },
    });

    res.json({ message: "You have left the list" });
  } catch (err) {
    req.log?.error({ err }, "Failed to leave list");
    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});

/**
 * @openapi
 * /list/{listId}/collaborators/{collaboratorId}:
 *   delete:
 *     summary: Remove a collaborator from a list
 *     description: Removes a collaborator from a list
 *     tags:
 *       - 📝 List
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: collaboratorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Collaborator removed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: List not found
 *       500:
 *         description: Internal server error
 */
listRouter.delete("/:listId/collaborators/:collaboratorId", requireAuth, async (req, res) => {
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

    await prisma.listCollaborator.delete({
      where: { listId_userId: { listId: list.id, userId: req.params.collaboratorId } },
    });

    res.json({ message: "Collaborator removed successfully" });
  } catch (err) {
    req.log?.error({ err }, "Failed to remove collaborator");
    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});

/**
 * @openapi
 * /list/{listId}/collaborators/invite:
 *   post:
 *     summary: Invite a collaborator to a list
 *     description: Invites a collaborator to a list by email. Returns an invitation link that can be sent via email or shared directly.
 *     tags:
 *       - 📝 List
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
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the person to invite
 *               role:
 *                 type: string
 *                 enum: [EDITOR, VIEWER, ADMIN]
 *                 default: VIEWER
 *                 description: Role to assign to the collaborator
 *               language:
 *                 type: string
 *                 enum: [fr, en]
 *                 default: en
 *                 description: Language for the invitation email
 *               sendEmail:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to send the invitation email. If false, only the link is returned.
 *     responses:
 *       200:
 *         description: Collaborator invited successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 inviteLink:
 *                   type: string
 *                   format: uri
 *                   description: Invitation link to share
 *                 emailSent:
 *                   type: boolean
 *                   description: Whether the email was sent
 *       400:
 *         description: Invalid input or collaborator already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: List not found
 *       500:
 *         description: Internal server error
 */
listRouter.post("/:listId/collaborators/invite", requireAuth, async (req, res) => {
  try {
    const { email, role, language, sendEmail } = inviteCollaboratorSchema.parse(req.body);

    const list = await prisma.poiList.findUnique({ where: { id: req.params.listId } });
    if (!list) {
      return res.status(404).json(formatError(ErrorCodes.LIST_NOT_FOUND, "List not found"));
    }

    const ownerRole = await checkListAccess(list, req.user!.id);
    if (!ownerRole) {
      return res.status(404).json(formatError(ErrorCodes.LIST_NOT_FOUND, "List not found"));
    }

    if (!["ADMIN", "OWNER"].includes(ownerRole)) {
      return res.status(403).json(formatError(ErrorCodes.LIST_ACCESS_DENIED, "Access denied"));
    }

    if (req.user!.email === email) {
      return res
        .status(400)
        .json(
          formatError(ErrorCodes.COLLABORATOR_CANNOT_INVITE_YOURSELF, "You cannot invite yourself")
        );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const collaborator = await prisma.listCollaborator.findUnique({
        where: { listId_userId: { listId: list.id, userId: existingUser.id } },
      });
      if (collaborator) {
        return res
          .status(400)
          .json(formatError(ErrorCodes.COLLABORATOR_ALREADY_EXISTS, "Collaborator already exists"));
      }
    }

    const invitationToken = jwt.sign(
      { listId: list.id, email, role, invitedBy: req.user!.id, type: "collaborator_invite" },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const inviteLink = `${env.FRONTEND_URL}/list/${list.id}/collaborators/accept?token=${invitationToken}`;

    let emailSent = false;
    if (sendEmail) {
      const invitedByName = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { name: true },
      });

      try {
        await sendCollaboratorInviteEmail(
          email,
          list.name,
          invitedByName?.name || req.user!.email,
          inviteLink,
          language
        );

        emailSent = true;
      } catch (emailError) {
        req.log?.error({ emailError }, "Failed to send collaborator invite email");
      }
    }

    res.json({
      inviteLink,
      emailSent,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const details = handleZodError(err);
      return res
        .status(400)
        .json(formatError(ErrorCodes.VALIDATION_ERROR, "Invalid input", details));
    }
    req.log?.error({ err }, "Failed to invite collaborator");
    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});

/**
 * @openapi
 * /list/{listId}/collaborators/join:
 *   post:
 *     summary: Join a list as a collaborator
 *     description: Joins a list as a collaborator by token
 *     tags:
 *       - 📝 List
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Collaborator joined successfully
 *       400:
 *         description: Invalid token or expired token
 *       404:
 *         description: List not found
 *       500:
 *         description: Internal server error
 */
listRouter.post("/:listId/collaborators/join", requireAuth, async (req, res) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      return res.status(400).json(formatError(ErrorCodes.TOKEN_REQUIRED, "Token is required"));
    }

    const list = await prisma.poiList.findUnique({ where: { id: req.params.listId } });
    if (!list) {
      return res.status(404).json(formatError(ErrorCodes.LIST_NOT_FOUND, "List not found"));
    }

    let payload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as {
        listId: string;
        email: string;
        role: string;
        invitedBy: string;
        type: string;
      };
    } catch {
      return res.status(400).json(formatError(ErrorCodes.SHARE_TOKEN_INVALID, "Invalid token"));
    }

    if (payload.type !== "collaborator_invite") {
      return res.status(400).json(formatError(ErrorCodes.SHARE_TOKEN_INVALID, "Invalid token"));
    }

    if (payload.email !== req.user!.email) {
      return res.status(400).json(formatError(ErrorCodes.SHARE_TOKEN_INVALID, "Invalid token"));
    }

    if (payload.listId !== list.id) {
      return res.status(400).json(formatError(ErrorCodes.SHARE_TOKEN_INVALID, "Invalid token"));
    }

    if (list.createdBy === req.user!.id) {
      return res
        .status(400)
        .json(
          formatError(
            ErrorCodes.COLLABORATOR_OWNER_CANNOT_JOIN,
            "You are already the owner of the list"
          )
        );
    }

    const existingCollaborator = await prisma.listCollaborator.findUnique({
      where: { listId_userId: { listId: list.id, userId: req.user!.id } },
    });
    if (existingCollaborator) {
      return res
        .status(400)
        .json(formatError(ErrorCodes.COLLABORATOR_ALREADY_EXISTS, "Collaborator already exists"));
    }

    await prisma.listCollaborator.create({
      data: {
        listId: list.id,
        userId: req.user!.id,
        role: payload.role as CollaboratorRole,
      },
    });

    res.json({ message: "Collaborator joined successfully", list: list });
  } catch (err) {
    req.log?.error({ err }, "Failed to join list");
    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});
