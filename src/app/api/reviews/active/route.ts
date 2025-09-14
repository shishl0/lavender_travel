import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

function toSafeImages(v: unknown): string[] {
  return Array.isArray(v) ? v.map(x => (typeof x === "string" ? x : "")).filter(Boolean) : [];
}

async function _GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit") || 24)));

  const rows = await prisma.review.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      text: true,
      images: true,
      rating: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const reviews = rows.map((r) => {
    const createdAtISO = r.createdAt?.toISOString() ?? null;
    const updatedAtISO = r.updatedAt?.toISOString() ?? null;

    return {
      id: r.id,
      name: r.name,
      text: r.text,
      images: toSafeImages(r.images),
      rating: Number.isFinite(r.rating as any) ? (r.rating as number) : 5,

      createdAtISO,
      updatedAtISO,

      createdAt: r.createdAt ? r.createdAt.getTime() : null, // ms
      created_at: createdAtISO,                               // ISO
      updatedAt: r.updatedAt ? r.updatedAt.getTime() : null, // ms
      updated_at: updatedAtISO,                               // ISO
    };
  });

  return NextResponse.json({ reviews });
}

export const GET = withAudit("reviews.active", _GET);