import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

async function _GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit") || 24)));

  const rows = await prisma.review.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true, name: true, text: true, images: true, rating: true,
      createdAt: true, updatedAt: true,
    },
  });

  return NextResponse.json({
    reviews: rows.map(r => ({
      id: r.id,
      name: r.name,
      text: r.text,
      images: r.images,
      rating: r.rating,
      createdAtISO: r.createdAt.toISOString(),
      updatedAtISO: r.updatedAt.toISOString(),
    })),
  });
}

export const GET = withAudit("reviews.active", _GET);