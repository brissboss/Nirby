/*
  Warnings:

  - Added the required column `createdBy` to the `Poi` table without a default value. This is not possible if the table is not empty.

*/
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "PoiVisibility" AS ENUM ('PRIVATE', 'SHARED', 'PUBLIC');

-- AlterTable
ALTER TABLE "Poi" ADD COLUMN     "address" TEXT,
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "visibility" "PoiVisibility" NOT NULL DEFAULT 'PRIVATE';

-- AddForeignKey
ALTER TABLE "Poi" ADD CONSTRAINT "Poi_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
