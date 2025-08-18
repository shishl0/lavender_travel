import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateDestinations } from "@/lib/cms-cache";
import { withAudit } from "@/lib/audit";
import { requireRole } from "@/lib/require-auth";

export const dynamic = "force-dynamic";

async function _POST(req: Request) {
  await requireRole(["ADMIN", "EDITOR"]);

  try {
    const body = await req.json();
    const { id, key, title, imageUrl, isActive } = body || {};
    if (!key || !title) {
      return NextResponse.json({ ok: false, error: "Missing key/title" }, { status: 400 });
    }

    if (id) {
      const updated = await prisma.destination.update({
        where: { id },
        data: { key, title, imageUrl, isActive: !!isActive },
      });
      invalidateDestinations();
      return NextResponse.json({ ok: true, id: updated.id });
    } else {
      const tail = await prisma.destination.count();
      const created = await prisma.destination.create({
        data: { key, title, imageUrl, isActive: !!isActive, sortOrder: tail },
      });
      invalidateDestinations();
      return NextResponse.json({ ok: true, id: created.id });
    }
  } catch (e) {
    console.error("destinations/save", e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

export const POST = withAudit(
  "destinations.save",
  _POST,
  (_req, _ctx, payload) => ({ type: "Destination", id: payload?.id ?? null }),
  "json"
);

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}