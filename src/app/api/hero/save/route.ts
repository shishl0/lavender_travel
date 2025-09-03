import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateHero } from "@/lib/cms-cache";
import { withAudit } from "@/lib/audit";
import { requireRole } from "@/lib/require-auth";

export const dynamic = "force-dynamic";

async function _POST(req: Request) {
  await requireRole(["ADMIN", "EDITOR"]);

  try {
    const body = await req.json();
    const {
      id,
      kicker, titleTop, titleBottom, subtitle,
      imageUrl, imageAlt,
    } = body || {};

    const data = { kicker, titleTop, titleBottom, subtitle, imageUrl, imageAlt } as const;

    if (id) {
      await prisma.hero.update({ where: { id }, data });
      invalidateHero();
      return NextResponse.json({ ok: true, id });
    } else {
      const created = await prisma.hero.create({
        data: { isActive: false, ...data },
      });
      invalidateHero();
      return NextResponse.json({ ok: true, id: created.id });
    }
  } catch (e) {
    console.error("hero/save", e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

export const POST = withAudit(
  "hero.save",
  _POST,
  (_req, _ctx, payload) => ({ type: "Hero", id: payload?.id ?? null }),
  "json",
);

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}