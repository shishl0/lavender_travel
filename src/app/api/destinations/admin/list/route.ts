// src/app/api/destinations/admin/list/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAudit } from "@/lib/audit";
import { requireRole } from "@/lib/require-auth";

export const dynamic = "force-dynamic";

async function _GET() {
  await requireRole(["ADMIN", "EDITOR"]);

  const rows = await prisma.destination.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      key: true,
      title: true,
      imageUrl: true,
      isActive: true,
      showOnHome: true,
      sortOrder: true,
    },
  });

  const items = rows.map((r) => ({
    id: r.id,
    key: r.key,
    title: (r.title ?? { ru: "", kk: "", en: "" }) as { ru?: string; kk?: string; en?: string },
    imageUrl: r.imageUrl ?? null,
    isActive: !!r.isActive,
    showOnHome: !!r.showOnHome,
    sortOrder: Number(r.sortOrder) || 0,
  }));

  return NextResponse.json({ items });
}

export const GET = withAudit("destinations.admin.list", _GET);