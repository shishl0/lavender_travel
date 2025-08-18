import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateDestinations } from "@/lib/cms-cache";
import { withAudit } from "@/lib/audit";
import { requireRole } from "@/lib/require-auth";

export const dynamic = "force-dynamic";

async function _POST(req: Request) {
  await requireRole(["ADMIN", "EDITOR"]);

  try {
    const { id } = (await req.json()) as { id?: string };
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await prisma.destination.delete({ where: { id } });

    const rest = await prisma.destination.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true },
    });

    await prisma.$transaction(
      rest.map((r, i) =>
        prisma.destination.update({
          where: { id: r.id },
          data: { sortOrder: i },
        }),
      ),
    );

    invalidateDestinations();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("delete destination error", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export const POST = withAudit(
  "destinations.delete",
  _POST,
  (_req, _ctx, payload) => ({ type: "Destination", id: payload?.id ?? null }),
  "json"
);

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}