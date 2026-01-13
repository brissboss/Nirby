-- DropForeignKey
ALTER TABLE "SavedPoi" DROP CONSTRAINT "SavedPoi_listId_fkey";

-- DropForeignKey
ALTER TABLE "SavedPoi" DROP CONSTRAINT "SavedPoi_poiId_fkey";

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

-- CreateIndex
CREATE UNIQUE INDEX "GooglePlaceCache_placeId_key" ON "GooglePlaceCache"("placeId");

-- AddForeignKey
ALTER TABLE "SavedPoi" ADD CONSTRAINT "SavedPoi_listId_fkey" FOREIGN KEY ("listId") REFERENCES "PoiList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPoi" ADD CONSTRAINT "SavedPoi_poiId_fkey" FOREIGN KEY ("poiId") REFERENCES "Poi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPoi" ADD CONSTRAINT "SavedPoi_googlePlaceId_fkey" FOREIGN KEY ("googlePlaceId") REFERENCES "GooglePlaceCache"("placeId") ON DELETE SET NULL ON UPDATE CASCADE;
