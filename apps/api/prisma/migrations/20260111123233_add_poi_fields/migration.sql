-- AlterTable
ALTER TABLE "Poi" ADD COLUMN     "category" TEXT,
ADD COLUMN     "categoryDisplay" TEXT,
ADD COLUMN     "descriptionLang" TEXT,
ADD COLUMN     "openingHours" JSONB,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "photoUrls" TEXT[],
ADD COLUMN     "priceLevel" INTEGER,
ADD COLUMN     "website" TEXT;
