import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateSettings } from "@/lib/cms-cache";
import { withAudit } from "@/lib/audit";
import { requireRole } from "@/lib/require-auth";

export const dynamic = "force-dynamic";

async function _POST(req: Request) {
  await requireRole(["ADMIN", "EDITOR"]);

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

    await prisma.$transaction([
      prisma.siteSettings.updateMany({ data: { isActive: false } }),
      prisma.siteSettings.update({ where: { id }, data: { isActive: true } }),
    ]);

    invalidateSettings();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("settings/activate error", e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

export const POST = withAudit(
  "settings.activate",
  _POST,
  (_req, _ctx, payload) => ({ type: "SiteSettings", id: payload?.id ?? null }),
  "json"
);

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}