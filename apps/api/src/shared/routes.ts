import { Router } from "express";

import { prisma } from "../db";
import { ErrorCodes } from "../utils/error-codes";
import { formatError } from "../utils/errors";

export const sharedRouter = Router();

/**
 * @openapi
 * /shared/{shareToken}:
 *   get:
 *     operationId: getSharedList
 *     summary: Get a shared list
 *     description: Returns a shared list
 *     tags:
 *       - Shared Access
 *     security:
 *       - []
 *     parameters:
 *       - in: path
 *         name: shareToken
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SharedListResponse'
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
sharedRouter.get("/:shareToken", async (req, res) => {
  try {
    const list = await prisma.poiList.findUnique({
      where: { shareToken: req.params.shareToken },
      include: { user: { select: { name: true, avatarUrl: true } } },
    });

    if (!list) {
      return res.status(404).json(formatError(ErrorCodes.LIST_NOT_FOUND, "List not found"));
    }

    if (list.shareTokenExpiresAt && list.shareTokenExpiresAt < new Date()) {
      return res
        .status(404)
        .json(formatError(ErrorCodes.SHARE_TOKEN_EXPIRED, "List share token expired"));
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { createdBy, user, ...publicList } = list;

    res.json({
      list: {
        ...publicList,
        creator: {
          name: user?.name || null,
          avatarUrl: user?.avatarUrl || null,
        },
      },
    });
  } catch (err) {
    req.log?.error({ err }, "Failed to get shared resource");
    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});

/**
 * @openapi
 * /shared/{shareToken}/pois:
 *   get:
 *     operationId: getSharedListPois
 *     summary: Get shared POIs in a list
 *     description: Returns shared POIs in a list
 *     tags:
 *       - Shared Access
 *     security:
 *       - []
 *     parameters:
 *       - in: path
 *         name: shareToken
 *         required: true
 *         schema:
 *           type: string
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
 *         description: Shared POIs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SharedPoisResponse'
 *       404:
 *         description: Shared POIs not found
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
sharedRouter.get("/:shareToken/pois", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const list = await prisma.poiList.findUnique({ where: { shareToken: req.params.shareToken } });

    if (!list) {
      return res.status(404).json(formatError(ErrorCodes.LIST_NOT_FOUND, "List not found"));
    }

    if (list.shareTokenExpiresAt && list.shareTokenExpiresAt < new Date()) {
      return res
        .status(404)
        .json(formatError(ErrorCodes.SHARE_TOKEN_EXPIRED, "List share token expired"));
    }

    const [savedPois, total] = await Promise.all([
      prisma.savedPoi.findMany({
        where: { listId: list.id },
        include: { poi: true, googlePlaceCache: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),

      prisma.savedPoi.count({
        where: { listId: list.id },
      }),
    ]);

    const publicPois = savedPois
      .map((savedPoi) => {
        if (savedPoi.googlePlaceCache) {
          return savedPoi.googlePlaceCache;
        } else if (savedPoi.poi) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { createdBy, ...publicPoi } = savedPoi.poi;
          return publicPoi;
        }
        return null;
      })
      .filter((poi) => poi !== null);

    res.json({
      pois: publicPois,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    req.log?.error({ err }, "Failed to get shared POIs");
    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});
