// src/app/api/destinations/admin/get/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-auth";
import { withAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

async function _GET(req: Request) {
  await requireRole(["ADMIN", "EDITOR"]);

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const key = searchParams.get("key");

  if (!id && !key) {
    return NextResponse.json({ error: "id or key required" }, { status: 400 });
  }

  const row = id
    ? await prisma.destination.findUnique({ where: { id } })
    : await prisma.destination.findUnique({ where: { key: String(key) } });

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    item: {
      id: row.id,
      key: row.key,
      title: (row.title ?? { ru: "", kk: "", en: "" }) as { ru?: string; kk?: string; en?: string },
      imageUrl: row.imageUrl ?? null,
      isActive: row.isActive,
      showOnHome: row.showOnHome,
      sortOrder: row.sortOrder,

      // пока не используем — просто не выводим, чтобы не плодить мусор в UI
      // priceFrom: row.priceFrom ?? null,
      // allowMinPrice: row.allowMinPrice ?? false,

      descriptionHtml: row.descriptionHtml ?? null,
      cities: row.cities ?? null,

      heroImages: Array.isArray(row.heroImages) ? row.heroImages : [],
      basics: row.basics ?? null,

      faqVisa: row.faqVisa ?? null,
      faqEntry: row.faqEntry ?? null,
      faqReturn: row.faqReturn ?? null,

      poi: row.poi ?? null,

      // валюта (для CurrencyEditor)
      currencyCode: row.currencyCode ?? null,
      currencyRateToKzt: row.currencyRateToKzt ?? null,
      currencyBase: row.currencyBase ?? "KZT",
      currencyProvider: row.currencyProvider ?? "exchangerate.host",
      currencyUpdatedAt: row.currencyUpdatedAt?.toISOString?.() ?? null,
    },
  });
}

export const GET = withAudit("destinations.admin.get", _GET);