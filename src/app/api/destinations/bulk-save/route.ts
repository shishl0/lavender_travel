import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateDestinations } from "@/lib/cms-cache";
import { withAudit } from "@/lib/audit";
import { requireRole } from "@/lib/require-auth";

export const dynamic = "force-dynamic";

const KEY_REGEX = /^[\p{L}\p{N}._-]+$/u;
const normalizeKey = (raw: unknown) => String(raw ?? "").trim().replace(/\s+/g, "-");
const asLocStrings = (v: any) => (v && typeof v === "object" ? v : null);
const asIntOrNull = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : null);

async function _POST(req: Request) {
  await requireRole(["ADMIN", "EDITOR"]);

  try {
    const body = await req.json();
    const itemsRaw = (body?.items ?? null) as any;

    if (!Array.isArray(itemsRaw)) {
      return NextResponse.json({ error: "Invalid payload: items must be an array" }, { status: 400 });
    }

    const items = itemsRaw.map((it: any, idx: number) => {
      const key = normalizeKey(it?.key);
      if (!key) {
        throw new Response(JSON.stringify({ error: `Bad key at index ${idx}: empty after normalization` }), { status: 400 });
      }
      if (!KEY_REGEX.test(key)) {
        throw new Response(JSON.stringify({ error: `Bad key at index ${idx}: "${it?.key}" (allowed: letters/numbers/-_.)` }), { status: 400 });
      }

      return {
        id: it?.id as string | undefined,
        key,
        title: {
          ru: it?.title?.ru ?? "",
          kk: it?.title?.kk ?? "",
          en: it?.title?.en ?? "",
        },
        imageUrl: it?.imageUrl ?? null,
        isActive: !!it?.isActive,
        sortOrder: Number(it?.sortOrder ?? 0),

        // NEW:
        cities: asLocStrings(it?.cities),
        priceFrom: asIntOrNull(it?.priceFrom),
        allowMinPrice: !!it?.allowMinPrice,
        showOnHome: !!it?.showOnHome,
      };
    });

    const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
    let activeCount = 0;
    const capped = sorted.map((it) => {
      if (it.isActive && activeCount < 90) { activeCount += 1; return it; }
      return { ...it, isActive: false };
    });

    const ids: string[] = [];

    for (const it of capped) {
      const data = {
        key: it.key,
        title: it.title as any,
        imageUrl: it.imageUrl,
        isActive: it.isActive,
        sortOrder: it.sortOrder,
        cities: it.cities as any,
        priceFrom: it.priceFrom,
        allowMinPrice: it.allowMinPrice,
        showOnHome: it.showOnHome,
      };

      if (it.id) {
        const updated = await prisma.destination.update({
          where: { id: it.id },
          data,
          select: { id: true },
        });
        ids.push(updated.id);
      } else {
        const exists = await prisma.destination.findUnique({ where: { key: it.key }, select: { id: true } });
        if (exists) {
          const updated = await prisma.destination.update({
            where: { id: exists.id },
            data,
            select: { id: true },
          });
          ids.push(updated.id);
        } else {
          const created = await prisma.destination.create({
            data,
            select: { id: true },
          });
          ids.push(created.id);
        }
      }
    }

    invalidateDestinations();
    return NextResponse.json({ ok: true, ids });
  } catch (e: any) {
    if (e instanceof Response) return e;
    console.error("bulk-save error", e);
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