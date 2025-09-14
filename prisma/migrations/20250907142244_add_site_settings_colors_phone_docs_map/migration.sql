/*
  Warnings:

  - You are about to drop the column `pricingMatrixUrl` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `pricingMinPriceEnabled` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `pricingMinPriceFormula` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `statsAutoAt` on the `SiteSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."SiteSettings" DROP COLUMN "pricingMatrixUrl",
DROP COLUMN "pricingMinPriceEnabled",
DROP COLUMN "pricingMinPriceFormula",
DROP COLUMN "statsAutoAt",
ADD COLUMN     "designAccentHex" TEXT,
ADD COLUMN     "designAccentInk" TEXT,
ADD COLUMN     "designAccentRgb" TEXT,
ADD COLUMN     "designBgRaw" TEXT,
ADD COLUMN     "designSurfaceRaw" TEXT,
ADD COLUMN     "mapEmbedUrl" TEXT,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "privacyPolicyDocUrls" JSONB,
ADD COLUMN     "termsOfServiceDocUrls" JSONB;
