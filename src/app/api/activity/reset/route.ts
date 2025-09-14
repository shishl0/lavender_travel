import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAudit } from "@/lib/audit";
import { requireRole } from "@/lib/require-auth";

export const dynamic = "force-dynamic";

async function _POST(req: Request) {
  await requireRole(["ADMIN"]);
  const res = await prisma.activity.deleteMany({});
  return NextResponse.json({ ok: true, deleted: res.count });
}

export const POST = withAudit("activity.resetAll", _POST);

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}