-- Allow GDPR account erasure to remove owned sessions, POIs and lists.
-- ListCollaborator.user and SavedPoi.poi/list already cascade.

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropForeignKey
ALTER TABLE "Poi" DROP CONSTRAINT "Poi_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "PoiList" DROP CONSTRAINT "PoiList_createdBy_fkey";

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poi" ADD CONSTRAINT "Poi_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoiList" ADD CONSTRAINT "PoiList_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
