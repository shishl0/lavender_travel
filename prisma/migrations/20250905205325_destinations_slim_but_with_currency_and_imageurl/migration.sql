/*
  Warnings:

  - You are about to drop the column `allowMinPrice` on the `Destination` table. All the data in the column will be lost.
  - You are about to drop the column `bestSeasons` on the `Destination` table. All the data in the column will be lost.
  - You are about to drop the column `facts` on the `Destination` table. All the data in the column will be lost.
  - You are about to drop the column `gallery` on the `Destination` table. All the data in the column will be lost.
  - You are about to drop the column `highlights` on the `Destination` table. All the data in the column will be lost.
  - You are about to drop the column `mapEmbedUrl` on the `Destination` table. All the data in the column will be lost.
  - You are about to drop the column `priceFrom` on the `Destination` table. All the data in the column will be lost.
  - You are about to drop the column `safety` on the `Destination` table. All the data in the column will be lost.
  - You are about to drop the column `visaInfo` on the `Destination` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Destination" DROP COLUMN "allowMinPrice",
DROP COLUMN "bestSeasons",
DROP COLUMN "facts",
DROP COLUMN "gallery",
DROP COLUMN "highlights",
DROP COLUMN "mapEmbedUrl",
DROP COLUMN "priceFrom",
DROP COLUMN "safety",
DROP COLUMN "visaInfo";
