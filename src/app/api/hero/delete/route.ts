import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateHero } from "@/lib/cms-cache";
import { withAudit } from "@/lib/audit";
import { requireRole } from "@/lib/require-auth";

export const dynamic = "force-dynamic";

async function _POST(req: Request) {
  await requireRole(["ADMIN", "EDITOR"]);

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

    const rec = await prisma.hero.findUnique({ where: { id } });
    if (!rec) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    if (rec.isActive) {
      return NextResponse.json({ ok: false, error: "Нельзя удалить активный профиль" }, { status: 400 });
    }

    await prisma.hero.delete({ where: { id } });
    invalidateHero();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("hero/delete", e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

export const POST = withAudit(
  "hero.delete",
  _POST,
  (_req, _ctx, payload) => ({ type: "Hero", id: payload?.id ?? null }),
  "json"
);

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}