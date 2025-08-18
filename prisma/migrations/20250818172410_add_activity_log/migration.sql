-- CreateEnum
CREATE TYPE "public"."ActivityStatus" AS ENUM ('OK', 'ERROR');

-- CreateTable
CREATE TABLE "public"."Activity" (
    "id" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status" "public"."ActivityStatus" NOT NULL DEFAULT 'OK',
    "actorId" TEXT,
    "actorEmail" TEXT,
    "role" TEXT,
    "targetType" TEXT,
    "targetId" TEXT,
    "ip" TEXT,
    "ua" TEXT,
    "durationMs" INTEGER,
    "payload" JSONB,
    "diff" JSONB,
    "error" TEXT,
    "meta" JSONB,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_activity_ts" ON "public"."Activity"("ts");

-- CreateIndex
CREATE INDEX "idx_activity_action_ts" ON "public"."Activity"("action", "ts");

-- CreateIndex
CREATE INDEX "idx_activity_actor_ts" ON "public"."Activity"("actorId", "ts");
