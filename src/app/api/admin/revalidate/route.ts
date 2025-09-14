import { NextResponse } from "next/server";
import { invalidateCmsAll } from "@/lib/cms-cache";
import { requireRole } from "@/lib/require-auth";
import { withAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

async function _POST() {
  await requireRole(["ADMIN", "EDITOR"]);
  invalidateCmsAll();
  return NextResponse.json({ ok: true });
}

export const POST = withAudit("cms.revalidateAll", _POST);

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}