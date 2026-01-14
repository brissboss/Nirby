import { PoiList } from "@prisma/client";

import { prisma } from "../db";

/**
 * Check user access to a list and return their role
 * @returns "OWNER" | "EDITOR" | "VIEWER" | "ADMIN" | null
 */
export async function checkListAccess(
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
