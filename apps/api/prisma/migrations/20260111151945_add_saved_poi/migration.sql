-- CreateTable
CREATE TABLE "SavedPoi" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "poiId" TEXT,
    "googlePlaceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedPoi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SavedPoi_listId_poiId_key" ON "SavedPoi"("listId", "poiId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedPoi_listId_googlePlaceId_key" ON "SavedPoi"("listId", "googlePlaceId");

-- AddForeignKey
ALTER TABLE "SavedPoi" ADD CONSTRAINT "SavedPoi_listId_fkey" FOREIGN KEY ("listId") REFERENCES "PoiList"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPoi" ADD CONSTRAINT "SavedPoi_poiId_fkey" FOREIGN KEY ("poiId") REFERENCES "Poi"("id") ON DELETE SET NULL ON UPDATE CASCADE;
