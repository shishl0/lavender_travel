import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAudit } from "@/lib/audit";
import { requireRole } from "@/lib/require-auth";

export const dynamic = "force-dynamic";

type Payload = { id?: string };

async function _POST(req: Request) {
  await requireRole(["ADMIN"]);

  const body = (await req.json().catch(() => ({}))) as Payload;
  const id = typeof body.id === "string" ? body.id : "";

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.review.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export const POST = withAudit(
  "reviews.delete",
  _POST,
  (_req, _ctx, payload?: Payload | null) => ({ type: "Review", id: payload?.id ?? null }),
  "json",
);