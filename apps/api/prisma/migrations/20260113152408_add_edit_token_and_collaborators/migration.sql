/*
  Warnings:

  - A unique constraint covering the columns `[editToken]` on the table `PoiList` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PoiList" ADD COLUMN     "editToken" TEXT,
ADD COLUMN     "editTokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "PoiList_editToken_key" ON "PoiList"("editToken");
