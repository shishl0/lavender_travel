import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAudit } from "@/lib/audit";
import { requireRole } from "@/lib/require-auth";

export const dynamic = "force-dynamic";

type Payload = { id?: string; isActive?: boolean };

async function _POST(req: Request) {
  await requireRole(["ADMIN", "EDITOR"]);

  const body = (await req.json().catch(() => ({}))) as Payload;
  const id = typeof body.id === "string" ? body.id : "";
  const isActive = typeof body.isActive === "boolean" ? body.isActive : undefined;

  if (!id || isActive === undefined) {
    return NextResponse.json({ error: "id and isActive required" }, { status: 400 });
  }

  const updated = await prisma.review.update({
    where: { id },
    data: { isActive },
    select: {
      id: true, name: true, text: true, images: true, rating: true, isActive: true,
      createdAt: true, updatedAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    review: {
      ...updated,
      createdAtISO: updated.createdAt.toISOString(),
      updatedAtISO: updated.updatedAt.toISOString(),
    },
  });
}

export const POST = withAudit(
  "reviews.activate",
  _POST,
  (_req, _ctx, payload?: Payload | null) => ({ type: "Review", id: payload?.id ?? null }),
  "json",
);