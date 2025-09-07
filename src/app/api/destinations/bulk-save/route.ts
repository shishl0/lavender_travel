import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateDestinations } from "@/lib/cms-cache";
import { withAudit } from "@/lib/audit";
import { requireRole } from "@/lib/require-auth";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

/* ---------------- helpers ---------------- */
const KEY_REGEX = /^[\p{L}\p{N}._-]+$/u;
const normalizeKey = (raw: unknown) => String(raw ?? "").trim().toLowerCase().replace(/\s+/g, "-");
const asStrOrNull = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const A = (v: unknown) => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);
const J = (v: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined =>
  v === undefined ? undefined : v === null ? Prisma.DbNull : (v as Prisma.InputJsonValue);

const capActive = <T extends { isActive: boolean }>(arr: T[], cap = 90) => {
  let n = 0;
  return arr.map((x) => (x.isActive && n < cap ? ((n += 1), x) : { ...x, isActive: false }));
};

/* ---------------- handler ---------------- */
async function _POST(req: Request) {
  await requireRole(["ADMIN", "EDITOR"]);

  try {
    const body = await req.json();
    const itemsRaw = body?.items;

    if (!Array.isArray(itemsRaw)) {
      return NextResponse.json({ error: "Invalid payload: items must be an array" }, { status: 400 });
    }

    const prepared = itemsRaw.map((it: any, idx: number) => {
      const key = normalizeKey(it?.key);
      if (!key) throw new Response(JSON.stringify({ error: `Bad key at index ${idx}: empty` }), { status: 400 });
      if (!KEY_REGEX.test(key)) {
        throw new Response(JSON.stringify({ error: `Bad key at index ${idx}: "${it?.key}" (only letters/numbers/._-)` }), { status: 400 });
      }

      return {
        id: it?.id as string | undefined,
        key,
        title: {
          ru: it?.title?.ru ?? "",
          kk: it?.title?.kk ?? "",
          en: it?.title?.en ?? "",
        } as Prisma.InputJsonValue,

        isActive: !!it?.isActive,
        showOnHome: !!it?.showOnHome,
        sortOrder: Number(it?.sortOrder ?? 0),

        imageUrl: asStrOrNull(it?.imageUrl),
        // priceFrom: Number.isFinite(Number(it?.priceFrom)) ? Number(it?.priceFrom) : null,
        // allowMinPrice: !!it?.allowMinPrice,

        descriptionHtml: J(it?.descriptionHtml),
        cities: J(it?.cities),

        heroImages: A(it?.heroImages),
        basics: J(it?.basics),

        faqVisa: J(it?.faqVisa),
        faqEntry: J(it?.faqEntry),
        faqReturn: J(it?.faqReturn),

        poi: J(it?.poi),
      };
    });

    const items = capActive(prepared, 90).sort((a, b) => a.sortOrder - b.sortOrder);

    const ids: string[] = await prisma.$transaction(async (tx) => {
      const out: string[] = [];

      for (const it of items) {
        if (it.id) {
          const updated = await tx.destination.update({
            where: { id: it.id },
            data: it,
            select: { id: true },
          });
          out.push(updated.id);
        } else {
          const existing = await tx.destination.findUnique({ where: { key: it.key }, select: { id: true } });
          if (existing) {
            const updated = await tx.destination.update({
              where: { id: existing.id },
              data: it,
              select: { id: true },
            });
            out.push(updated.id);
          } else {
            const created = await tx.destination.create({
              data: it,
              select: { id: true },
            });
            out.push(created.id);
          }
        }
      }
      return out;
    });

    invalidateDestinations();
    return NextResponse.json({ ok: true, ids });
  } catch (e: any) {
    if (e instanceof Response) return e;
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Key must be unique" }, { status: 409 });
    }
    console.error("destinations.bulk-save error", {
      name: e?.name, code: e?.code, meta: e?.meta, message: e?.message,
    });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export const POST = withAudit(
  "destinations.bulkSave",
  _POST,
  async () => ({ type: "Destination", id: null }),
  "json",
);

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}