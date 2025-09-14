import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ResetButton from "./ui/ResetButton";
import ChartCard from "@/components/analytics/ChartCard";
import {
  APP_TZ,
  recentDaysYMD,
  ymdInTZ,
  ymdToUTCDate,
  dayLabelFromYMD,
  hourInTZ,
  hourLabel,
} from "@/lib/tz";

export const dynamic = "force-dynamic";

type Granularity = "hour" | "day";
type RangeCode = "today" | "7d" | "30d" | "180d";

type ParsedRange = {
  code: RangeCode;
  days: number;
  granularity: Granularity;
  baseLabel: string;
};

function parseRange(sp: Record<string, string | string[] | undefined>): ParsedRange {
  const q = (typeof sp?.range === "string" ? sp.range : "30d") as RangeCode;
  switch (q) {
    case "today":
      return { code: q, days: 1, granularity: "hour", baseLabel: "за день" };
    case "7d":
      return { code: q, days: 7, granularity: "day", baseLabel: "за 7 дней" };
    case "180d":
      return { code: q, days: 180, granularity: "day", baseLabel: "за 180 дней" };
    case "30d":
    default:
      return { code: "30d", days: 30, granularity: "day", baseLabel: "за 30 дней" };
  }
}

/** +N/-N дней к YMD в таймзоне APP_TZ */
function ymdAdd(ymd: string, deltaDays: number) {
  const d = ymdToUTCDate(ymd); // начало дня в TZ -> UTC Date
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return ymdInTZ(d, APP_TZ);
}

/** Возвращает список YMD начиная с startYmd длиной days */
function makeDaysRange(startYmd: string, days: number) {
  const out: string[] = [];
  for (let i = 0; i < days; i++) out.push(ymdAdd(startYmd, i));
  return out;
}

/** Бакет по дням строго по заданному диапазону YMD */
function bucketByDayExact(rows: { createdAt: Date }[], startYmd: string, days: number) {
  const ymds = makeDaysRange(startYmd, days);
  const map = new Map<string, number>();
  for (const y of ymds) map.set(y, 0);

  for (const r of rows) {
    const key = ymdInTZ(r.createdAt, APP_TZ);
    if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
  }

  return Array.from(map.entries()).map(([ymd, value]) => ({
    x: dayLabelFromYMD(ymd),
    y: value,
  }));
}

// Бакет по часам в таймзоне APP_TZ
function bucketByHour(rows: { createdAt: Date }[]) {
  const map = new Map<number, number>();
  for (let h = 0; h < 24; h++) map.set(h, 0);
  for (const r of rows) {
    const h = hourInTZ(r.createdAt, APP_TZ);
    map.set(h, (map.get(h) || 0) + 1);
  }
  return Array.from(map.entries()).map(([h, value]) => ({ x: hourLabel(h), y: value }));
}

/** Считает окно [since, until) по TZ с учётом offset */
function computeWindow(days: number, granularity: Granularity, offset: number) {
  const now = new Date();
  const baseYmd = ymdInTZ(now, APP_TZ);

  // не позволяем листать в будущее
  const off = Math.min(offset, 0);

  let startYmd: string;
  let endYmd: string;

  if (granularity === "hour") {
    // Для режима по часам показываем выбранный день (по умолчанию — сегодня)
    startYmd = ymdAdd(baseYmd, off);
    endYmd = ymdAdd(startYmd, 1);
  } else {
    // Для дневных диапазонов по умолчанию показываем последние `days` дней,
    // заканчивающиеся сегодня (включая сегодня).
    // offset=0  -> [today - (days-1); tomorrow)
    // offset=-1 -> окно на days раньше и т.д.
    const baseEnd = ymdAdd(baseYmd, 1);        // завтра, чтобы включить текущий день
    endYmd = ymdAdd(baseEnd, off * days);      // сдвигаем пачками по `days`
    startYmd = ymdAdd(endYmd, -days);
  }

  const since = ymdToUTCDate(startYmd); // включительно
  const until = ymdToUTCDate(endYmd);   // исключительно

  return { since, until, startYmd, endYmd };
}

function formatRangeLabel(startYmd: string, endYmd: string, granularity: Granularity) {
  if (granularity === "hour") {
    return dayLabelFromYMD(startYmd); // один день
  }
  // интервал по датам: [start; end)
  const start = dayLabelFromYMD(startYmd);
  const lastDayYmd = ymdAdd(endYmd, -1);
  const end = dayLabelFromYMD(lastDayYmd);
  return `${start} — ${end}`;
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { code, days, granularity, baseLabel } = parseRange(sp);

  const offset = Number(typeof sp?.offset === "string" ? sp.offset : 0) || 0;
  const { since, until, startYmd, endYmd } = computeWindow(days, granularity, offset);
  const label = formatRangeLabel(startYmd, endYmd, granularity);

  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role ?? "VIEWER";
  const canReset = role === "ADMIN";

  // 1) Сырые события
  const [pv, wa, ig, leads] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: { type: "page_view", createdAt: { gte: since, lt: until } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.analyticsEvent.findMany({
      where: { type: "click_whatsapp", createdAt: { gte: since, lt: until } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.analyticsEvent.findMany({
      where: {
      createdAt: { gte: since, lt: until },
      OR: [{ type: "click_instagram" }, { type: "click_footer_instagram" }],},
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.analyticsEvent.findMany({
      where: { type: "submit_form", createdAt: { gte: since, lt: until } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // 2) Разбивки (groupBy без orderBy; сортируем в JS)
  const [devicesRaw, localesRaw] = await Promise.all([
    prisma.analyticsEvent.groupBy({
      by: ["device"],
      where: { createdAt: { gte: since, lt: until } },
      _count: { _all: true },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["locale"],
      where: { createdAt: { gte: since, lt: until } },
      _count: { _all: true },
    }),
  ]);

  const devices = devicesRaw
    .sort((a, b) => b._count._all - a._count._all)
    .map((r) => ({ label: r.device ?? "—", value: r._count._all }));

  const locales = localesRaw
    .sort((a, b) => b._count._all - a._count._all)
    .map((r) => ({ label: r.locale ?? "—", value: r._count._all }));

  // 3) UTM из JSON
  const utmRows = await prisma.analyticsEvent.findMany({
    where: { createdAt: { gte: since, lt: until } },
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
  const pvSeries = granularity === "hour" ? bucketByHour(pv) : bucketByDayExact(pv, startYmd, days);
  const waSeries = granularity === "hour" ? bucketByHour(wa) : bucketByDayExact(wa, startYmd, days);
  const igSeries = granularity === "hour" ? bucketByHour(ig) : bucketByDayExact(ig, startYmd, days);
  const leadSeries = granularity === "hour" ? bucketByHour(leads) : bucketByDayExact(leads, startYmd, days);

  // 5) Метрики
  const visits = pv.length || 1;
  const clicks = wa.length;
  const igClicks = ig.length;
  const leadCount = leads.length;
  const cvWhToLead = visits ? Math.round((leadCount / visits) * 1000) / 10 : 0;

  // ссылки навигации по окнам
  const mkHref = (r: RangeCode, off: number) => `/admin/analytics?range=${r}&offset=${off}`;
  const canGoForward = offset < 0;

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Аналитика</h1>
        {canReset && <ResetButton />}
      </div>

      {/* Фильтры + навигация по окнам */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {/* Табы диапазонов */}
        <RangeTab code="today" active={code} label="1 день" currentOffset={offset} />
        <RangeTab code="7d" active={code} label="7 дней" currentOffset={offset} />
        <RangeTab code="30d" active={code} label="30 дней" currentOffset={offset} />
        <RangeTab code="180d" active={code} label="180 дней" currentOffset={offset} />

        {/* Пейджер интервалов */}
        <div className="ml-auto flex items-center gap-2">
        <Link
          href={mkHref(code, offset - 1)}
          className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-gray-300 bg-white
                    hover:bg-gray-50 active:scale-[0.98] transition press"
          aria-label="Назад"
          title="Назад"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>

        <div className="px-3 h-9 inline-flex items-center rounded-full border border-gray-200 bg-white text-xs text-gray-700">
          {baseLabel} · {label}
        </div>

        {canGoForward ? (
          <Link
            href={mkHref(code, offset + 1)}
            className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-gray-300 bg-white
                      hover:bg-gray-50 active:scale-[0.98] transition press"
            aria-label="Вперёд"
            title="Вперёд"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        ) : (
          <span
            aria-disabled
            className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
            title="Текущий период"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        )}
      </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card title="Посещения">
          <div className={`text-2xl font-semibold ${pvSeries.some((s) => s.y > 0) ? "" : "opacity-60"}`}>
            {pv.length}
          </div>
          <ChartCard data={pvSeries} />
        </Card>

        <Card title="Клики WhatsApp">
          <div className={`text-2xl font-semibold ${waSeries.some((s) => s.y > 0) ? "" : "opacity-60"}`}>
            {clicks}
          </div>
          <ChartCard data={waSeries} />
        </Card>
        
        <Card title="Клики Instagram">
          <div className={`text-2xl font-semibold ${igSeries.some((s) => s.y > 0) ? "" : "opacity-60"}`}>
          {igClicks}
          </div>
          <ChartCard data={igSeries} />
        </Card>

        <Card title="Заявки с формы">
          <div className={`text-2xl font-semibold ${leadSeries.some((s) => s.y > 0) ? "" : "opacity-60"}`}>
            {leadCount}
          </div>
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

function RangeTab({
  code,
  active,
  label,
  currentOffset,
}: {
  code: RangeCode;
  active: RangeCode;
  label: string;
  currentOffset: number;
}) {
  const isActive = code === active;
  return (
    <Link
      href={`/admin/analytics?range=${code}&offset=0`}
      aria-current={isActive ? "page" : undefined}
      className={`px-3 h-9 inline-flex items-center rounded-full border text-[13px] transition
        ${isActive
          ? "bg-[#5e3bb7]/10 border-[#5e3bb7]/30 text-[#3c2a7a]"
          : "bg-white border-gray-300 hover:bg-gray-50 text-gray-800"}`}
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
