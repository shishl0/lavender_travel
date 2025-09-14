import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAudit } from "@/lib/audit";
import { requireRole } from "@/lib/require-auth";
import type { Review } from "@prisma/client";

export const dynamic = "force-dynamic";

async function _GET() {
  await requireRole(["ADMIN", "EDITOR"]);

  const rows: Review[] = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    reviews: rows.map((r) => ({
      id: r.id,
      name: r.name,
      text: r.text,
      images: r.images,
      rating: r.rating,
      isActive: r.isActive,
      createdAtISO: r.createdAt.toISOString(),
      updatedAtISO: r.updatedAt.toISOString(),
    })),
  });
}

export const GET = withAudit("reviews.list", _GET);