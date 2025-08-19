import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAudit } from "@/lib/audit";
import { requireRole } from "@/lib/require-auth";
import { APP_TZ, ymdInTZ } from "@/lib/tz";

type Bucket = {
  dayISO: string;
  type: string;
  path: string;
  locale: string;
  count: number;
};

async function _POST(_req: Request) {
  await requireRole(["ADMIN"]);

  try {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 180);

    const windowStart = new Date(cutoff);
    windowStart.setDate(windowStart.getDate() - 60);

    const rows = await prisma.analyticsEvent.findMany({
      where: { createdAt: { lt: cutoff, gte: windowStart } },
      select: { createdAt: true, type: true, path: true, locale: true },
    });

    const buckets = new Map<string, Bucket>();

    for (const r of rows) {
      const dayISO = ymdInTZ(r.createdAt, APP_TZ); // "YYYY-MM-DD"
      const pathSafe = r.path ?? "";
      const localeSafe = r.locale ?? "";
      const key = [dayISO, r.type, pathSafe, localeSafe].join("|");

      const cur =
        buckets.get(key) ??
        ({
          dayISO,
          type: r.type,
          path: pathSafe,
          locale: localeSafe,
          count: 0,
        } as Bucket);

      cur.count += 1;
      buckets.set(key, cur);
    }

    for (const b of buckets.values()) {
      await prisma.analyticsDaily.upsert({
        where: {
          day_type_path_locale: {
            day: new Date(b.dayISO),
            type: b.type,
            path: b.path,
            locale: b.locale,
          },
        },
        update: { count: { increment: b.count } },
        create: {
          day: new Date(b.dayISO),
          type: b.type,
          path: b.path,
          locale: b.locale,
          count: b.count,
        },
      });
    }

    await prisma.analyticsEvent.deleteMany({
      where: { createdAt: { lt: cutoff, gte: windowStart } },
    });

    return NextResponse.json({
      ok: true,
      aggregatedDays: buckets.size,
      deleted: rows.length,
    });
  } catch (e) {
    console.error("analytics.rollup error", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export const POST = withAudit("analytics.rollup", _POST);