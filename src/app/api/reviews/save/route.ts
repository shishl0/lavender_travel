import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAudit } from "@/lib/audit";
import { requireRole } from "@/lib/require-auth";

export const dynamic = "force-dynamic";

type Payload = {
  id?: string;
  name?: string;
  text?: string;
  images?: unknown;
  isActive?: boolean;
  rating?: unknown;
};

function normalizeImages(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map(x => (typeof x === "string" ? x.trim() : ""))
           .filter(Boolean)
           .slice(0, 5);
}
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

async function _POST(req: Request) {
  await requireRole(["ADMIN", "EDITOR"]);

  const body = (await req.json().catch(() => ({}))) as Payload;
  const id = typeof body.id === "string" && body.id ? body.id : undefined;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const images = normalizeImages(body.images);
  const isActive = typeof body.isActive === "boolean" ? body.isActive : undefined;

  const ratingRaw = Number(body.rating);
  const rating = Number.isFinite(ratingRaw) ? clamp(Math.round(ratingRaw), 1, 5) : undefined;

  if (!name || !text) {
    return NextResponse.json({ error: "name and text are required" }, { status: 400 });
  }

  if (id) {
    const updated = await prisma.review.update({
      where: { id },
      data: {
        name, text, images,
        ...(isActive === undefined ? {} : { isActive }),
        ...(rating === undefined ? {} : { rating }),
      },
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

  const created = await prisma.review.create({
    data: {
      name, text, images,
      isActive: isActive ?? false,
      rating: rating ?? 5,
    },
    select: {
      id: true, name: true, text: true, images: true, rating: true, isActive: true,
      createdAt: true, updatedAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    review: {
      ...created,
      createdAtISO: created.createdAt.toISOString(),
      updatedAtISO: created.updatedAt.toISOString(),
    },
  });
}

export const POST = withAudit(
  "reviews.save",
  _POST,
  (_req, _ctx, payload?: Payload | null) => ({ type: "Review", id: payload?.id ?? null }),
  "json",
);