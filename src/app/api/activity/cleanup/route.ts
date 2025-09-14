import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAudit } from "@/lib/audit";
import { requireRole } from "@/lib/require-auth";

async function _POST(req: Request) {
  await requireRole(["ADMIN"]);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 180);
  const res = await prisma.activity.deleteMany({
    where: { ts: { lt: cutoff } },
  });
  return NextResponse.json({ ok: true, deleted: res.count });
}

export const POST = withAudit("activity.cleanup", _POST);