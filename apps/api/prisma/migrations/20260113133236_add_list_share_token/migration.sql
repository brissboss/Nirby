/*
  Warnings:

  - A unique constraint covering the columns `[shareToken]` on the table `PoiList` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PoiList" ADD COLUMN     "shareToken" TEXT,
ADD COLUMN     "shareTokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "PoiList_shareToken_key" ON "PoiList"("shareToken");
