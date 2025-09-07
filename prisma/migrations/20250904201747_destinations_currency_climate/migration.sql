/*
  Warnings:

  - You are about to drop the column `airC` on the `DestinationClimate` table. All the data in the column will be lost.
  - You are about to drop the column `month` on the `DestinationClimate` table. All the data in the column will be lost.
  - You are about to drop the column `waterC` on the `DestinationClimate` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `DestinationClimate` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[destinationId]` on the table `DestinationClimate` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `months` to the `DestinationClimate` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."DestinationClimate_destinationId_year_month_key";

-- AlterTable
ALTER TABLE "public"."Destination" ADD COLUMN     "currencyBase" VARCHAR(3) DEFAULT 'KZT',
ADD COLUMN     "currencyCode" VARCHAR(3),
ADD COLUMN     "currencyProvider" TEXT,
ADD COLUMN     "currencyRateToKzt" DOUBLE PRECISION,
ADD COLUMN     "currencyUpdatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."DestinationClimate" DROP COLUMN "airC",
DROP COLUMN "month",
DROP COLUMN "waterC",
DROP COLUMN "year",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "months" JSONB NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DestinationClimate_destinationId_key" ON "public"."DestinationClimate"("destinationId");
