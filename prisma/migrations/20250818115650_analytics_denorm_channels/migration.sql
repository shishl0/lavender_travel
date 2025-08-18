-- AlterTable
ALTER TABLE "public"."AnalyticsEvent" ADD COLUMN     "campaign" TEXT,
ADD COLUMN     "channel" TEXT,
ADD COLUMN     "medium" TEXT,
ADD COLUMN     "source" TEXT;

-- CreateIndex
CREATE INDEX "AnalyticsEvent_type_createdAt_idx" ON "public"."AnalyticsEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_channel_createdAt_idx" ON "public"."AnalyticsEvent"("channel", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_source_createdAt_idx" ON "public"."AnalyticsEvent"("source", "createdAt");
