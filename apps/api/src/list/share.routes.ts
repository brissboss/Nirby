import crypto from "crypto";

import { Router } from "express";

import { requireAuth } from "../auth/middleware";
import { prisma } from "../db";
import { env } from "../env";
import { ErrorCodes } from "../utils/error-codes";
import { formatError } from "../utils/errors";

import { checkListAccess } from "./utils";

export const listShareRouter = Router();

/**
 * @openapi
 * /list/{listId}/share:
 *   post:
 *     operationId: shareList
 *     summary: Share a list
 *     description: Shares a list with a user by generating a share link
 *     tags:
 *       - Sharing
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShareLinkResponse'
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
listShareRouter.post("/:listId/share", requireAuth, async (req, res) => {
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
 *     operationId: unshareList
 *     summary: Unshare a list
 *     description: Unshares a list
 *     tags:
 *       - Sharing
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
listShareRouter.delete("/:listId/share", requireAuth, async (req, res) => {
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
 *     operationId: generateEditLink
 *     summary: Generate an edit link for a list
 *     description: Generates an edit link for a list
 *     tags:
 *       - Sharing
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EditLinkResponse'
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
listShareRouter.post("/:listId/edit-link", requireAuth, async (req, res) => {
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
 *     operationId: revokeEditLink
 *     summary: Revoke an edit link for a list
 *     description: Revokes an edit link for a list
 *     tags:
 *       - Sharing
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
listShareRouter.delete("/:listId/edit-link", requireAuth, async (req, res) => {
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
 *     operationId: joinListByEditLink
 *     summary: Join a list using an edit link
 *     description: Joins a list using an edit link
 *     tags:
 *       - Sharing
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JoinListResponse'
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
listShareRouter.post("/join", requireAuth, async (req, res) => {
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
      list,
    });
  } catch (err) {
    req.log?.error({ err }, "Failed to join list");
    return res.status(500).json(formatError(ErrorCodes.INTERNAL_ERROR, "Internal server error"));
  }
});
