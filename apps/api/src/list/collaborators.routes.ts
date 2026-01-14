import { CollaboratorRole } from "@prisma/client";
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

import { checkListAccess } from "./utils";

export const listCollaboratorsRouter = Router();

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
 * /list/{listId}/collaborators:
 *   get:
 *     summary: Get the collaborators of a list
 *     description: Gets the collaborators of a list
 *     tags:
 *       - Collaborators
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
listCollaboratorsRouter.get("/:listId/collaborators", requireAuth, async (req, res) => {
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
 *       - Collaborators
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
listCollaboratorsRouter.delete("/:listId/collaborators/me", requireAuth, async (req, res) => {
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
 *       - Collaborators
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
listCollaboratorsRouter.delete(
  "/:listId/collaborators/:collaboratorId",
  requireAuth,
  async (req, res) => {
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
  }
);

/**
 * @openapi
 * /list/{listId}/collaborators/invite:
 *   post:
 *     summary: Invite a collaborator to a list
 *     description: Invites a collaborator to a list by email. Returns an invitation link that can be sent via email or shared directly.
 *     tags:
 *       - Collaborators
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
listCollaboratorsRouter.post("/:listId/collaborators/invite", requireAuth, async (req, res) => {
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
 *       - Collaborators
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
listCollaboratorsRouter.post("/:listId/collaborators/join", requireAuth, async (req, res) => {
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
