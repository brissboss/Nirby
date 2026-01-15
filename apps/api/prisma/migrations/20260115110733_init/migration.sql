-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "PoiVisibility" AS ENUM ('PRIVATE', 'SHARED', 'PUBLIC');

-- CreateEnum
CREATE TYPE "CollaboratorRole" AS ENUM ('VIEWER', 'EDITOR', 'ADMIN', 'OWNER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "bio" VARCHAR(255),
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "emailVerificationExpiresAt" TIMESTAMP(3),
    "passwordResetToken" TEXT,
    "passwordResetExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Poi" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "descriptionLang" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "location" geometry(Point, 4326),
    "category" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "priceLevel" INTEGER,
    "openingHours" JSONB,
    "photoUrls" TEXT[],
    "createdBy" TEXT NOT NULL,
    "visibility" "PoiVisibility" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Poi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GooglePlaceCache" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameLang" TEXT,
    "description" TEXT,
    "descriptionLang" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "location" geometry(Point, 4326),
    "category" TEXT,
    "categoryDisplayName" TEXT,
    "categoryDisplayNameLang" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "priceLevel" INTEGER,
    "openingHours" JSONB,
    "rating" DOUBLE PRECISION,
    "userRatingCount" INTEGER,
    "photoReferences" TEXT[],
    "googleMapsUri" TEXT,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "GooglePlaceCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoiList" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "createdBy" TEXT NOT NULL,
    "visibility" "PoiVisibility" NOT NULL DEFAULT 'PRIVATE',
    "shareToken" TEXT,
    "shareTokenExpiresAt" TIMESTAMP(3),
    "editToken" TEXT,
    "editTokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PoiList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedPoi" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "poiId" TEXT,
    "googlePlaceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedPoi_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshToken_key" ON "Session"("refreshToken");

-- CreateIndex
CREATE UNIQUE INDEX "GooglePlaceCache_placeId_key" ON "GooglePlaceCache"("placeId");

-- CreateIndex
CREATE UNIQUE INDEX "PoiList_shareToken_key" ON "PoiList"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "PoiList_editToken_key" ON "PoiList"("editToken");

-- CreateIndex
CREATE UNIQUE INDEX "SavedPoi_listId_poiId_key" ON "SavedPoi"("listId", "poiId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedPoi_listId_googlePlaceId_key" ON "SavedPoi"("listId", "googlePlaceId");

-- CreateIndex
CREATE UNIQUE INDEX "ListCollaborator_listId_userId_key" ON "ListCollaborator"("listId", "userId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poi" ADD CONSTRAINT "Poi_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoiList" ADD CONSTRAINT "PoiList_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPoi" ADD CONSTRAINT "SavedPoi_listId_fkey" FOREIGN KEY ("listId") REFERENCES "PoiList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPoi" ADD CONSTRAINT "SavedPoi_poiId_fkey" FOREIGN KEY ("poiId") REFERENCES "Poi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPoi" ADD CONSTRAINT "SavedPoi_googlePlaceId_fkey" FOREIGN KEY ("googlePlaceId") REFERENCES "GooglePlaceCache"("placeId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListCollaborator" ADD CONSTRAINT "ListCollaborator_listId_fkey" FOREIGN KEY ("listId") REFERENCES "PoiList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListCollaborator" ADD CONSTRAINT "ListCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
