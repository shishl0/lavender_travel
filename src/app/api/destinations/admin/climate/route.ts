import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAudit } from "@/lib/audit";
import { requireRole } from "@/lib/require-auth";
import { invalidateDestinations } from "@/lib/cms-cache";

export const dynamic = "force-dynamic";

/* ========= utils ========= */

const isAllNull = (a: (number | null)[] = []) => a.every((v) => v == null);

function rotateSeqToJanDec(
  arr: (number | null)[] | null | undefined,
  startMonth1to12?: number | null
) {
  if (!Array.isArray(arr) || arr.length !== 12 || !startMonth1to12) {
    return arr ?? Array(12).fill(null);
  }
  const out = Array<number | null>(12).fill(null);
  // arr[0] относится к месяцу startMonth1to12, arr[1] — к следующему и т.д.
  for (let i = 0; i < 12; i++) {
    const monthIdx = (startMonth1to12 - 1 + i) % 12; // 0..11 — индекс месяца Янв=0
    out[monthIdx] = arr[i] ?? null;
  }
  return out;
}

function daysInMonthUTC(year: number, month1to12: number) {
  return new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
}

/** Последние 12 полных месяцев: [YYYY-MM-DD, YYYY-MM-DD] + календарь месяцев */
function lastFull12MonthWindow() {
  const now = new Date();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0)); // последний день прошлого месяца
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 11, 1));

  const months: Array<{ y: number; m: number; days: number }> = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    months.push({ y, m, days: daysInMonthUTC(y, m) });
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  const startISO = `${months[0].y}-${pad(months[0].m)}-01`;
  const endISO = `${months[11].y}-${pad(months[11].m)}-${pad(daysInMonthUTC(months[11].y, months[11].m))}`;
  return { startISO, endISO, months };
}

/** Аггрегация: суммируем по календарному месяцу и делим на кол-во дней месяца */
function monthlyFromDailyStrict(
  dates: string[] = [],
  values: number[] = [],
  calendar: Array<{ y: number; m: number; days: number }>
): (number | null)[] {
  const keyOf = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;
  const sums: Record<string, number> = {};
  const seen: Record<string, boolean> = {};
  for (const mm of calendar) {
    const k = keyOf(mm.y, mm.m);
    sums[k] = 0;
    seen[k] = false;
  }
  for (let i = 0; i < dates.length; i++) {
    const iso = dates[i];
    const v = values[i];
    if (!Number.isFinite(v)) continue;
    const y = +iso.slice(0, 4);
    const m = +iso.slice(5, 7);
    const k = keyOf(y, m);
    if (k in sums) {
      sums[k] += v;
      seen[k] = true;
    }
  }
  return calendar.map((mm) => {
    const k = keyOf(mm.y, mm.m);
    if (!seen[k]) return null;
    const mean = sums[k] / mm.days;
    return Number.isFinite(mean) ? +mean.toFixed(1) : null;
  });
}

/** Hourly → дневное среднее (10–18 локального времени), затем месяцы */
function hourlyToMonthlyDaytimeMean(
  timesLocalISO: string[] = [],
  values: number[] = [],
  calendar: Array<{ y: number; m: number; days: number }>
) {
  const sum: Record<string, number> = {};
  const cnt: Record<string, number> = {};
  for (let i = 0; i < timesLocalISO.length; i++) {
    const iso = timesLocalISO[i]; // уже локальная таймзона (timezone=auto)
    const v = values[i];
    if (!Number.isFinite(v)) continue;
    const day = iso.slice(0, 10);
    const hh = +iso.slice(11, 13);
    if (hh >= 10 && hh <= 18) {
      sum[day] = (sum[day] ?? 0) + v;
      cnt[day] = (cnt[day] ?? 0) + 1;
    }
  }
  const dates = Object.keys(sum).sort();
  const daily = dates.map((d) => sum[d] / cnt[d]);
  return monthlyFromDailyStrict(dates, daily, calendar);
}

/** Hourly → суточное среднее, затем месяцы */
function hourlyToMonthlyMean(
  timesLocalISO: string[] = [],
  values: number[] = [],
  calendar: Array<{ y: number; m: number; days: number }>
) {
  const sum: Record<string, number> = {};
  const cnt: Record<string, number> = {};
  for (let i = 0; i < timesLocalISO.length; i++) {
    const iso = timesLocalISO[i]; // локальная дата (timezone=auto)
    const v = values[i];
    if (!Number.isFinite(v)) continue;
    const day = iso.slice(0, 10);
    sum[day] = (sum[day] ?? 0) + v;
    cnt[day] = (cnt[day] ?? 0) + 1;
  }
  const dates = Object.keys(sum).sort();
  const daily = dates.map((d) => sum[d] / cnt[d]);
  return monthlyFromDailyStrict(dates, daily, calendar);
}

/* ========= fetchers ========= */

type EraResult = {
  airC: (number | null)[];
  humidity: (number | null)[];
  meta: Record<string, any>;
};

type MarineResult = {
  sst: (number | null)[];
  meta: Record<string, any>;
};

/** ERA5: воздух (hourly→daytime mean), влажность (daily) */
async function fetchEra5Monthly(lat: number, lon: number): Promise<EraResult> {
  const { startISO, endISO, months } = lastFull12MonthWindow();
  let airC: (number | null)[] | null = null;
  let humidity: (number | null)[] = new Array(12).fill(null);

  // air: hourly temperature_2m, timezone=auto → дневное среднее → месяцы
  try {
    const hr = await fetch(
      `https://archive-api.open-meteo.com/v1/era5` +
        `?latitude=${lat}&longitude=${lon}&start_date=${startISO}&end_date=${endISO}` +
        `&hourly=temperature_2m&timezone=auto`,
      { cache: "no-store" }
    );
    if (hr.ok) {
      const j = await hr.json();
      airC = hourlyToMonthlyDaytimeMean(j?.hourly?.time ?? [], j?.hourly?.temperature_2m ?? [], months);
    }
  } catch {}

  // humidity (и fallback для airC): daily means → месяцы
  try {
    const rd = await fetch(
      `https://archive-api.open-meteo.com/v1/era5` +
        `?latitude=${lat}&longitude=${lon}&start_date=${startISO}&end_date=${endISO}` +
        `&daily=temperature_2m_mean,relative_humidity_2m_mean&timezone=UTC`,
      { cache: "no-store" }
    );
    if (rd.ok) {
      const j = await rd.json();
      const dt: string[] = j?.daily?.time ?? [];
      const tMean: number[] = j?.daily?.temperature_2m_mean ?? [];
      const hMean: number[] = j?.daily?.relative_humidity_2m_mean ?? [];
      if (!airC) airC = monthlyFromDailyStrict(dt, tMean, months);
      humidity = monthlyFromDailyStrict(dt, hMean, months).map((v) => (v == null ? null : Math.round(v)));
    }
  } catch {}

  return {
    airC: airC ?? new Array(12).fill(null),
    humidity,
    meta: {
      window: [startISO, endISO],
      source: "open-meteo(air: hourly→daytime-mean→monthly; humidity: daily→monthly)",
      note: "airC = среднее по часам 10–18 каждого дня, затем среднее по дням месяца",
    },
  };
}

/** Marine SST: hourly sea_surface_temperature, поиск ближайшей морской ячейки (до 0.8°) */
async function fetchMarineSST(lat: number, lon: number): Promise<MarineResult> {
  const { startISO, endISO, months } = lastFull12MonthWindow();

  async function tryPoint(la: number, lo: number) {
    try {
      const r = await fetch(
        `https://marine-api.open-meteo.com/v1/marine` +
          `?latitude=${la}&longitude=${lo}&start_date=${startISO}&end_date=${endISO}` +
          `&hourly=sea_surface_temperature&timezone=auto`,
        { cache: "no-store" }
      );
      if (!r.ok) return null;
      const j = await r.json();
      const times: string[] = j?.hourly?.time ?? [];
      const vals: number[] = j?.hourly?.sea_surface_temperature ?? [];
      if (!times.length || !vals.length) return null;

      // hourly → daily mean → monthly
      const sst = hourlyToMonthlyMean(times, vals, months);

      // требуем хотя бы 2/3 дней в каждом месяце, иначе ставим null
      const filled = sst.map((mVal, i) => {
        const y = months[i].y,
          m = months[i].m,
          days = months[i].days;
        const present = times
          .filter((d) => +d.slice(0, 4) === y && +d.slice(5, 7) === m)
          .map((d) => d.slice(0, 10))
          .filter((v, idx, arr) => arr.indexOf(v) === idx).length;
        return present >= Math.round(days * 0.66) ? mVal : null;
      });

      if (isAllNull(filled)) return null;
      return {
        sst: filled,
        meta: {
          window: [startISO, endISO],
          source: "open-meteo(marine hourly→daily mean→monthly)",
          point: [la, lo],
        },
      };
    } catch {
      return null;
    }
  }

  // 16 направлений × радиусы: 0, 0.1, 0.2, 0.4, 0.6, 0.8
  const dirs: Array<[number, number]> = Array.from({ length: 16 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 16;
    return [Math.sin(a), Math.cos(a)];
  });
  const radii = [0, 0.1, 0.2, 0.4, 0.6, 0.8];

  for (const r of radii) {
    const batch = await Promise.all(
      dirs.map(([sy, sx]) => tryPoint(+((lat + sy * r).toFixed(5)), +((lon + sx * r).toFixed(5))))
    );
    const hit = batch.find(Boolean) as MarineResult | undefined;
    if (hit) return hit;
  }

  return {
    sst: new Array(12).fill(null),
    meta: { window: [startISO, endISO], source: "open-meteo(marine)", ok: false },
  };
}

/* ========= API ========= */

async function _GET(req: Request) {
  await requireRole(["ADMIN", "EDITOR"]);
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const key = searchParams.get("key");
  if (!id && !key) return NextResponse.json({ error: "id or key required" }, { status: 400 });

  const dest = id
    ? await prisma.destination.findUnique({ where: { id } })
    : await prisma.destination.findUnique({ where: { key: String(key) } });
  if (!dest) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const climate = await prisma.destinationClimate.findUnique({
    where: { destinationId: dest.id },
  });

  return NextResponse.json({
    item: {
      destinationId: dest.id,
      key: dest.key,
      latitude: climate?.latitude ?? null,
      longitude: climate?.longitude ?? null,
      source: climate?.source ?? null,
      months: (climate?.months as any) ?? null,
      updatedAt: climate?.updatedAt?.toISOString?.() ?? null,
    },
  });
}

async function _POST(req: Request) {
  await requireRole(["ADMIN", "EDITOR"]);
  const body = await req.json().catch(() => ({} as any));

  const id = body?.id ?? null;
  const key = body?.key ?? null;
  const lat = Number(body?.latitude);
  const lon = Number(body?.longitude);

  if (!id && !key) return NextResponse.json({ error: "id or key required" }, { status: 400 });
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "latitude/longitude required" }, { status: 400 });
  }

  const dest = id
    ? await prisma.destination.findUnique({ where: { id } })
    : await prisma.destination.findUnique({ where: { key: String(key) } });
  if (!dest) return NextResponse.json({ error: "Destination not found" }, { status: 404 });

  // параллельно тянем ERA5 и SST
  const [era, marine] = await Promise.all([
    fetchEra5Monthly(lat, lon).catch(() => null),
    fetchMarineSST(lat, lon).catch(() => null),
  ]);

  // месяцы, с которых начинаются их 12-элементные окна
  const eraStartMonth = era?.meta?.window?.[0]
    ? Number(String(era.meta.window[0]).slice(5, 7))
    : null;
  const marineStartMonth =
    (marine as any)?.meta?.window?.[0]
      ? Number(String((marine as any).meta.window[0]).slice(5, 7))
      : eraStartMonth;

  // Повернуть в календарный порядок Янв→Дек
  const airCJanDec = rotateSeqToJanDec(era?.airC, eraStartMonth);
  const humidityJanDec = rotateSeqToJanDec(era?.humidity, eraStartMonth);
  const waterCJanDec = rotateSeqToJanDec((marine as any)?.sst, marineStartMonth);

  const monthsJson = {
    yearUsing: new Date().getUTCFullYear(),
    source: "open-meteo(era5+marine)",
    airC: airCJanDec ?? Array(12).fill(null),
    waterC: waterCJanDec ?? Array(12).fill(null),
    humidity: humidityJanDec ?? Array(12).fill(null),
    meta: {
      era: era?.meta ?? { ok: false },
      marine: (marine as any)?.meta ?? { ok: false },
      note: "arrays rotated to Jan..Dec based on meta.window[0]",
      startMonth: { era: eraStartMonth, marine: marineStartMonth },
    },
  };

  const saved = await prisma.destinationClimate.upsert({
    where: { destinationId: dest.id },
    create: {
      destinationId: dest.id,
      latitude: lat,
      longitude: lon,
      source: monthsJson.source,
      months: monthsJson as any,
    },
    update: {
      latitude: lat,
      longitude: lon,
      source: monthsJson.source,
      months: monthsJson as any,
    },
    select: { id: true },
  });

  invalidateDestinations();
  return NextResponse.json({ ok: true, id: saved.id, months: monthsJson });
}

export const GET = withAudit("destinations.climate.get", _GET);
export const POST = withAudit(
  "destinations.climate.set",
  _POST,
  (_req, _ctx, payload) => ({ type: "DestinationClimate", id: payload?.id ?? null }),
  "json"
);