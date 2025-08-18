import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ResetButton from "./ui/ResetButton";
import ChartCard from "@/components/analytics/ChartCard";

export const dynamic = "force-dynamic";

type Granularity = "hour" | "day";
type RangeCode = "today" | "7d" | "30d" | "180d";

type ParsedRange = {
  code: RangeCode;
  days: number;
  granularity: Granularity;
  label: string;
};

function parseRange(sp: Record<string, string | string[] | undefined>): ParsedRange {
  const q = (typeof sp?.range === "string" ? sp.range : "30d") as RangeCode;
  switch (q) {
    case "today": return { code: q, days: 1,   granularity: "hour", label: "за сегодня" };
    case "7d":    return { code: q, days: 7,   granularity: "day",  label: "за 7 дней" };
    case "180d":  return { code: q, days: 180, granularity: "day",  label: "за 180 дней" };
    case "30d":
    default:      return { code: "30d", days: 30, granularity: "day", label: "за 30 дней" };
  }
}

function fmtDay(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}`;
}
function fmtHour(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}

// дневной бакет
function bucketByDay(rows: { createdAt: Date }[], days = 30) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const map = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    map.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of rows) {
    const key = r.createdAt.toISOString().slice(0, 10);
    if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map.entries()).map(([iso, value]) => ({ x: fmtDay(iso), y: value }));
}

// почасовой бакет (за сегодня)
function bucketByHour(rows: { createdAt: Date }[]) {
  const base = new Date();
  base.setMinutes(0, 0, 0);
  const map = new Map<number, number>();
  for (let h = 0; h < 24; h++) map.set(h, 0);
  for (const r of rows) {
    const h = new Date(r.createdAt).getHours();
    map.set(h, (map.get(h) || 0) + 1);
  }
  return Array.from(map.entries()).map(([h, value]) => ({ x: fmtHour(h), y: value }));
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { code, days, granularity, label } = parseRange(sp);

  const since = new Date();
  since.setDate(since.getDate() - days);

  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role ?? "VIEWER";
  const canReset = role === "ADMIN";

  // 1) Сырые события
  const [pv, wa, leads] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: { type: "page_view", createdAt: { gte: since } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.analyticsEvent.findMany({
      where: { type: "click_whatsapp", createdAt: { gte: since } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.analyticsEvent.findMany({
      where: { type: "submit_form", createdAt: { gte: since } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // 2) Разбивки (groupBy без orderBy; сортируем в JS)
  const [devicesRaw, localesRaw] = await Promise.all([
    prisma.analyticsEvent.groupBy({
      by: ["device"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["locale"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
  ]);

  const devices = devicesRaw
    .sort((a, b) => b._count._all - a._count._all)
    .map((r) => ({ label: r.device ?? "—", value: r._count._all }));

  const locales = localesRaw
    .sort((a, b) => b._count._all - a._count._all)
    .map((r) => ({ label: r.locale ?? "—", value: r._count._all }));

  // 3) UTM из JSON (source/medium/campaign)
  const utmRows = await prisma.analyticsEvent.findMany({
    where: { createdAt: { gte: since } },
    select: { utm: true },
  });
  function topFromJson(key: "source" | "medium" | "campaign", topN = 8) {
    const m = new Map<string, number>();
    for (const r of utmRows) {
      const v = (r.utm as any)?.[key];
      const k = v ? String(v) : "Прямой заход";
      m.set(k, (m.get(k) || 0) + 1);
    }
    return Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([k, v]) => ({ label: k, value: v }));
  }
  const utmSource = topFromJson("source");
  const utmMedium = topFromJson("medium");
  const utmCampaign = topFromJson("campaign");

  // 4) Серии для графиков
  const makeSeries = (rows: { createdAt: Date }[]) =>
    granularity === "hour" ? bucketByHour(rows) : bucketByDay(rows, days);

  const pvSeries = makeSeries(pv);
  const waSeries = makeSeries(wa);
  const leadSeries = makeSeries(leads);

  // 5) Метрики
  const visits = pv.length || 1;
  const clicks = wa.length;
  const leadCount = leads.length;
  const cvWhToLead = visits ? Math.round((leadCount / visits) * 1000) / 10 : 0;

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Аналитика</h1>
        {canReset && <ResetButton />}
      </div>

      {/* Фильтры периодов */}
      <div className="flex items-center gap-2 text-sm">
        <RangeTab code="today" active={code} label="Сегодня" />
        <RangeTab code="7d"    active={code} label="7 дней" />
        <RangeTab code="30d"   active={code} label="30 дней" />
        <RangeTab code="180d"  active={code} label="180 дней" />
        <div className="ml-auto text-xs text-gray-500">{label}</div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card title="Посещения">
          <div className={`text-2xl font-semibold ${pvSeries.some(s => s.y > 0) ? "" : "opacity-60"}`}>{pv.length}</div>
          <ChartCard data={pvSeries} />
        </Card>

        <Card title="Клики WhatsApp">
          <div className={`text-2xl font-semibold ${waSeries.some(s => s.y > 0) ? "" : "opacity-60"}`}>{clicks}</div>
          <ChartCard data={waSeries} />
        </Card>

        <Card title="Заявки с формы">
          <div className={`text-2xl font-semibold ${leadSeries.some(s => s.y > 0) ? "" : "opacity-60"}`}>{leadCount}</div>
          <ChartCard data={leadSeries} />
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card title="Каналы трафика">
          <Table pairs={utmMedium} empty="Пусто" />
        </Card>
        <Card title="Источники (сайты/площадки)">
          <Table pairs={utmSource} empty="Пусто" />
        </Card>
        <Card title="Рекламные кампании">
          <Table pairs={utmCampaign} empty="Пусто" />
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Устройства">
          <Table pairs={devices} empty="Пусто" />
        </Card>
        <Card title="Язык браузера">
          <Table pairs={locales} empty="Пусто" />
        </Card>
      </div>

      <Card title="Конверсия (заявки/посещения)">
        <div className="text-2xl font-semibold">{cvWhToLead}%</div>
        <div className="text-xs text-gray-500">{label}</div>
      </Card>
    </div>
  );
}

function RangeTab({ code, active, label }: { code: RangeCode; active: RangeCode; label: string }) {
  const isActive = code === active;
  return (
    <Link
      href={`/admin/analytics?range=${code}`}
      className={`px-3 py-1.5 rounded-lg border text-[13px] ${
        isActive ? "bg-[#5e3bb7]/10 border-[#5e3bb7]/30 text-[#3c2a7a]" : "hover:bg-gray-50"
      }`}
    >
      {label}
    </Link>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <div className="text-sm text-gray-500 mb-1">{title}</div>
      {children}
    </div>
  );
}

function Table({ pairs, empty }: { pairs: { label: string; value: number }[]; empty: string }) {
  if (!pairs.length) return <div className="text-gray-500 text-sm">{empty}</div>;
  return (
    <ul className="text-sm">
      {pairs.map((x) => (
        <li key={x.label} className="flex items-center justify-between border-t py-1">
          <span className="text-gray-700 truncate max-w-[70%]">{x.label}</span>
          <span className="text-gray-900 font-medium">{x.value}</span>
        </li>
      ))}
    </ul>
  );
}