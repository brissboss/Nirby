-- CreateEnum
CREATE TYPE "CollaboratorRole" AS ENUM ('VIEWER', 'EDITOR', 'ADMIN', 'OWNER');

-- CreateTable
CREATE TABLE "ListCollaborator" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CollaboratorRole" NOT NULL DEFAULT 'EDITOR',
    "invitedBy" TEXT,
    "joinedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ListCollaborator_listId_userId_key" ON "ListCollaborator"("listId", "userId");

-- AddForeignKey
ALTER TABLE "ListCollaborator" ADD CONSTRAINT "ListCollaborator_listId_fkey" FOREIGN KEY ("listId") REFERENCES "PoiList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListCollaborator" ADD CONSTRAINT "ListCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
