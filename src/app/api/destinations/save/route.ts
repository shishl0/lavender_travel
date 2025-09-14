import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateDestinations } from "@/lib/cms-cache";
import { withAudit } from "@/lib/audit";
import { requireRole } from "@/lib/require-auth";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const KEY_REGEX = /^[\p{L}\p{N}._-]+$/u;
const normalizeKey = (raw: unknown) => String(raw ?? "").trim().toLowerCase().replace(/\s+/g, "-");
const asStrOrNull = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const A = (v: unknown) => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);
const J = (v: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined =>
  v === undefined ? undefined : v === null ? Prisma.DbNull : (v as Prisma.InputJsonValue);

async function _POST(req: Request) {
  await requireRole(["ADMIN", "EDITOR"]);

  try {
    const body = await req.json();

    const id: string | undefined = body?.id ? String(body.id) : undefined;
    const key = normalizeKey(body?.key);
    const title = body?.title;

    if (!key || !title) return NextResponse.json({ ok: false, error: "Missing key/title" }, { status: 400 });
    if (!KEY_REGEX.test(key)) return NextResponse.json({ ok: false, error: "Bad key (only letters/numbers/._-)" }, { status: 400 });
    if (typeof title !== "object") return NextResponse.json({ ok: false, error: "title must be a localized object" }, { status: 400 });

    const base = {
      key,
      title: title as Prisma.InputJsonValue,
      imageUrl: asStrOrNull(body?.imageUrl),
      isActive: !!body?.isActive,
      showOnHome: !!body?.showOnHome,

      // позже включим
      // priceFrom: Number.isFinite(Number(body?.priceFrom)) ? Number(body?.priceFrom) : null,
      // allowMinPrice: !!body?.allowMinPrice,

      sortOrder: Number.isFinite(Number(body?.sortOrder)) ? Number(body.sortOrder) : undefined,

      descriptionHtml: J(body?.descriptionHtml),
      cities: J(body?.cities),

      heroImages: A(body?.heroImages),
      basics: J(body?.basics),

      faqVisa: J(body?.faqVisa),
      faqEntry: J(body?.faqEntry),
      faqReturn: J(body?.faqReturn),

      poi: J(body?.poi),
    };

    let savedId: string;

    if (id) {
      const updated = await prisma.destination.update({
        where: { id },
        data: {
          key: base.key,
          title: base.title,
          imageUrl: base.imageUrl,
          isActive: base.isActive,
          showOnHome: base.showOnHome,

          descriptionHtml: base.descriptionHtml,
          cities: base.cities,

          heroImages: base.heroImages,
          basics: base.basics,

          faqVisa: base.faqVisa,
          faqEntry: base.faqEntry,
          faqReturn: base.faqReturn,

          poi: base.poi,

          ...(base.sortOrder !== undefined ? { sortOrder: base.sortOrder } : {}),
          // ...(base.priceFrom !== undefined ? { priceFrom: base.priceFrom } : {}),
          // allowMinPrice: base.allowMinPrice,
        },
        select: { id: true },
      });
      savedId = updated.id;
    } else {
      const exists = await prisma.destination.findUnique({ where: { key: base.key }, select: { id: true } });

      if (exists) {
        const updated = await prisma.destination.update({
          where: { id: exists.id },
          data: {
            key: base.key,
            title: base.title,
            imageUrl: base.imageUrl,
            isActive: base.isActive,
            showOnHome: base.showOnHome,

            descriptionHtml: base.descriptionHtml,
            cities: base.cities,

            heroImages: base.heroImages,
            basics: base.basics,

            faqVisa: base.faqVisa,
            faqEntry: base.faqEntry,
            faqReturn: base.faqReturn,

            poi: base.poi,

            ...(base.sortOrder !== undefined ? { sortOrder: base.sortOrder } : {}),
            // ...(base.priceFrom !== undefined ? { priceFrom: base.priceFrom } : {}),
            // allowMinPrice: base.allowMinPrice,
          },
          select: { id: true },
        });
        savedId = updated.id;
      } else {
        const tail = await prisma.destination.count();
        const createSortOrder = base.sortOrder ?? tail;

        const created = await prisma.destination.create({
          data: {
            key: base.key,
            title: base.title,
            imageUrl: base.imageUrl,
            isActive: base.isActive,
            showOnHome: base.showOnHome,
            sortOrder: createSortOrder,

            descriptionHtml: base.descriptionHtml,
            cities: base.cities,

            heroImages: base.heroImages,
            basics: base.basics,

            faqVisa: base.faqVisa,
            faqEntry: base.faqEntry,
            faqReturn: base.faqReturn,

            poi: base.poi,

            // priceFrom: base.priceFrom,
            // allowMinPrice: base.allowMinPrice,
          },
          select: { id: true },
        });
        savedId = created.id;
      }
    }

    invalidateDestinations();
    return NextResponse.json({ ok: true, id: savedId });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ ok: false, error: "Key must be unique" }, { status: 409 });
    }
    console.error("destinations.save error", { name: e?.name, code: e?.code, meta: e?.meta, message: e?.message });
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