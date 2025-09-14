import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateDestinations } from "@/lib/cms-cache";
import { withAudit } from "@/lib/audit";
import { requireRole } from "@/lib/require-auth";

export const dynamic = "force-dynamic";

async function _POST(req: Request) {
  await requireRole(["ADMIN", "EDITOR"]);

  try {
    const { ids } = (await req.json()) as { ids?: string[] };
    if (!Array.isArray(ids)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await prisma.$transaction(
      ids.map((id, i) =>
        prisma.destination.update({
          where: { id },
          data: { sortOrder: i },
        }),
      ),
    );

    invalidateDestinations();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("destinations.reorder error", {
      name: e?.name,
      code: e?.code,
      meta: e?.meta,
      message: e?.message,
    });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export const POST = withAudit(
  "destinations.reorder",
  _POST,
  async () => ({ type: "Destination", id: null }),
  "json",
);

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}