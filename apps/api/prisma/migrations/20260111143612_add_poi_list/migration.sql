-- CreateTable
CREATE TABLE "PoiList" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "createdBy" TEXT NOT NULL,
    "visibility" "PoiVisibility" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PoiList_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PoiList" ADD CONSTRAINT "PoiList_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
