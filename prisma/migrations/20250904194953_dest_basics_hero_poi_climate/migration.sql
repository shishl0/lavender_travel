-- AlterTable
ALTER TABLE "public"."Destination" ADD COLUMN     "basics" JSONB,
ADD COLUMN     "faqEntry" JSONB,
ADD COLUMN     "faqReturn" JSONB,
ADD COLUMN     "faqVisa" JSONB,
ADD COLUMN     "heroImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "poi" JSONB;

-- CreateTable
CREATE TABLE "public"."DestinationClimate" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "airC" DOUBLE PRECISION,
    "waterC" DOUBLE PRECISION,
    "source" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DestinationClimate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DestinationClimate_destinationId_year_month_key" ON "public"."DestinationClimate"("destinationId", "year", "month");

-- AddForeignKey
ALTER TABLE "public"."DestinationClimate" ADD CONSTRAINT "DestinationClimate_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "public"."Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;
