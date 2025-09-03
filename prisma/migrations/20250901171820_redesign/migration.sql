/*
  Warnings:

  - You are about to drop the column `ctaPrimary` on the `Hero` table. All the data in the column will be lost.
  - You are about to drop the column `ctaSecondary` on the `Hero` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Destination" ADD COLUMN     "allowMinPrice" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cities" JSONB,
ADD COLUMN     "priceFrom" INTEGER,
ADD COLUMN     "showOnHome" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Hero" DROP COLUMN "ctaPrimary",
DROP COLUMN "ctaSecondary";

-- AlterTable
ALTER TABLE "public"."SiteSettings" ADD COLUMN     "address" JSONB,
ADD COLUMN     "certificateUrl" TEXT,
ADD COLUMN     "inTourismSince" TIMESTAMP(3),
ADD COLUMN     "pricingMatrixUrl" TEXT,
ADD COLUMN     "pricingMinPriceEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pricingMinPriceFormula" TEXT,
ADD COLUMN     "privacyPolicy" JSONB,
ADD COLUMN     "statsAutoAt" TIMESTAMP(3),
ADD COLUMN     "statsClients" INTEGER,
ADD COLUMN     "statsMode" TEXT,
ADD COLUMN     "statsRating" DOUBLE PRECISION,
ADD COLUMN     "termsOfService" JSONB;
