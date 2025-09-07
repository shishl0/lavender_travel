/*
  Warnings:

  - You are about to drop the column `designAccentHex` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `designAccentInk` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `designAccentRgb` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `designBgRaw` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `designSurfaceRaw` on the `SiteSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."SiteSettings" DROP COLUMN "designAccentHex",
DROP COLUMN "designAccentInk",
DROP COLUMN "designAccentRgb",
DROP COLUMN "designBgRaw",
DROP COLUMN "designSurfaceRaw";
