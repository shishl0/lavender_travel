import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await prisma.destination.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        key: true,
        title: true,
        isActive: true,
      },
    });
    const items = rows.map((r) => ({
      id: r.id,
      key: r.key,
      title: (r.title ?? { ru: "", kk: "", en: "" }) as { ru?: string; kk?: string; en?: string },
      isActive: !!r.isActive,
    }));
    return NextResponse.json({ items });
  } catch (e) {
    console.error("destinations.public.list error", e);
    return NextResponse.json({ items: [] });
  }
}

