import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateDestinations } from "@/lib/cms-cache";
import { withAudit } from "@/lib/audit";
import { requireRole } from "@/lib/require-auth";

export const dynamic = "force-dynamic";

const asLocStrings = (v: any) => (v && typeof v === "object" ? v : null);
const asIntOrNull = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : null);

async function _POST(req: Request) {
  await requireRole(["ADMIN", "EDITOR"]);

  try {
    const body = await req.json();
    const {
      id,
      key,
      title,
      imageUrl,
      isActive,
      sortOrder,
      // NEW:
      cities,
      priceFrom,
      allowMinPrice,
      showOnHome,
    } = body || {};

    if (!key || !title) {
      return NextResponse.json({ ok: false, error: "Missing key/title" }, { status: 400 });
    }

    const base = {
      key: String(key),
      title: title as any,
      imageUrl: typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : null,
      isActive: !!isActive,

      // NEW:
      cities: asLocStrings(cities),
      priceFrom: asIntOrNull(priceFrom),
      allowMinPrice: !!allowMinPrice,
      showOnHome: !!showOnHome,
    };

    let savedId: string;

    if (id) {
      // в update можно безопасно передать sortOrder, если прислали
      const updated = await prisma.destination.update({
        where: { id: String(id) },
        data: {
          ...base,
          ...(Number.isFinite(Number(sortOrder)) ? { sortOrder: Number(sortOrder) } : {}),
        },
        select: { id: true },
      });
      savedId = updated.id;
    } else {
      const tail = await prisma.destination.count();
      const createSortOrder = Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : tail;

      const created = await prisma.destination.create({
        data: {
          ...base,
          sortOrder: createSortOrder, // ← без дублирования/перезаписи
        },
        select: { id: true },
      });
      savedId = created.id;
    }

    invalidateDestinations();
    return NextResponse.json({ ok: true, id: savedId });
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