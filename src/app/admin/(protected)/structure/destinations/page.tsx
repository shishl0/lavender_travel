import { prisma } from "@/lib/prisma";
import DestinationsManager from "./ui/DestinationsManager";

export const dynamic = "force-dynamic";

export default async function DestinationsPage() {
  const rows = await prisma.destination.findMany({
    orderBy: { sortOrder: "asc" },
  });

  const toStrArr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

  const list = rows.map((r) => ({
    id: r.id,
    key: r.key,
    title: (r.title ?? { ru: "", kk: "", en: "" }) as { ru?: string; kk?: string; en?: string },
    imageUrl: r.imageUrl ?? null,
    isActive: r.isActive,
    showOnHome: r.showOnHome,
    sortOrder: r.sortOrder,

    heroImages: toStrArr(r.heroImages ?? []),
    basics: (r.basics ?? null) as any,
    descriptionHtml: (r.descriptionHtml ?? null) as any,
    cities: (r.cities ?? null) as any,

    faqVisa: (r.faqVisa ?? null) as any,
    faqEntry: (r.faqEntry ?? null) as any,
    faqReturn: (r.faqReturn ?? null) as any,

    poi: (r.poi ?? null) as any,

    currencyCode: r.currencyCode ?? null,
    currencyRateToKzt: r.currencyRateToKzt ?? null,
    currencyBase: r.currencyBase ?? "KZT",
    currencyProvider: r.currencyProvider ?? "exchangerate.host",
    currencyUpdatedAt: r.currencyUpdatedAt ?? null,
  }));

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[18px] md:text-[20px] font-extrabold text-[var(--navy)]">Направления</h2>
            <p className="text-slate-600 text-sm mt-0.5">Редактируйте страны, описания, климат, валюты и галереи.</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <DestinationsManager list={list} />
      </div>
    </div>
  );
}
