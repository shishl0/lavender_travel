import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateSettings, buildSnapshot } from "@/lib/cms-cache";
import fs from "fs/promises";
import path from "path";
import { withAudit } from "@/lib/audit";
import { requireRole } from "@/lib/require-auth";

export const dynamic = "force-dynamic";

async function _POST(req: Request) {
  await requireRole(["ADMIN", "EDITOR"]);

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const row = await prisma.siteSettings.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (row.isActive) {
      return NextResponse.json({ error: "Нельзя удалить активный профиль" }, { status: 400 });
    }

    await prisma.siteSettings.delete({ where: { id } });

    invalidateSettings();
    const snapshot = await buildSnapshot();
    const SNAPSHOT_PATH = path.join(process.cwd(), "public", "cms-snapshot.json");
    await fs.writeFile(SNAPSHOT_PATH, JSON.stringify(snapshot ?? {}));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("settings/delete error", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export const POST = withAudit(
  "settings.delete",
  _POST,
  (_req, _ctx, payload) => ({ type: "SiteSettings", id: payload?.id ?? null }),
  "json"
);

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}