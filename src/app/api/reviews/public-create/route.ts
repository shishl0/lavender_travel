import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type Payload = { name?: string; text?: string; images?: unknown; rating?: unknown };

function normalizeImages(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map(x => (typeof x === "string" ? x.trim() : ""))
           .filter(Boolean)
           .slice(0, 5);
}
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

async function _POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Payload;

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const images = normalizeImages(body.images);
  const ratingRaw = Number(body.rating);
  const rating = Number.isFinite(ratingRaw) ? clamp(Math.round(ratingRaw), 1, 5) : 5;

  if (!name || !text) {
    return NextResponse.json({ error: "name and text are required" }, { status: 400 });
  }

  const review = await prisma.review.create({
    data: { name, text, images, rating, isActive: true },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, reviewId: review.id });
}

export const POST = withAudit(
  "reviews.publicCreate",
  _POST,
  () => ({ type: "Review", id: null }),
  "json",
);