-- AlterTable
ALTER TABLE "public"."Destination" ADD COLUMN     "bestSeasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "descriptionHtml" JSONB,
ADD COLUMN     "facts" JSONB,
ADD COLUMN     "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "highlights" JSONB,
ADD COLUMN     "mapEmbedUrl" TEXT,
ADD COLUMN     "safety" JSONB,
ADD COLUMN     "visaInfo" JSONB;
