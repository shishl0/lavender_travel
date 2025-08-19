-- AlterTable
ALTER TABLE "public"."Review" ADD COLUMN     "rating" SMALLINT NOT NULL DEFAULT 5;

-- CreateIndex
CREATE INDEX "Review_isActive_createdAt_idx" ON "public"."Review"("isActive", "createdAt");
