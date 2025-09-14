import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withAudit } from "@/lib/audit";

async function _POST() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [ev, daily] = await Promise.all([
    prisma.analyticsEvent.deleteMany({}),
    prisma.analyticsDaily.deleteMany({}),
  ]);

  return NextResponse.json({ ok: true, deletedEvents: ev.count, deletedDaily: daily.count });
}

export const POST = withAudit("analytics.reset", _POST);