import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readUtmCookie } from "@/lib/utm-server";
import { classifySource } from "@/lib/analytics-source";
import { withAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

async function _POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { type, path, locale, referrer, device } = body ?? {};
    if (!type) return NextResponse.json({ error: "Missing type" }, { status: 400 });

    const utm = await readUtmCookie();
    const cls = classifySource({
      utm,
      referrer:
        typeof referrer === "string"
          ? referrer
          : (typeof document !== "undefined" ? document.referrer : undefined),
    });

    await prisma.analyticsEvent.create({
      data: {
        type: String(type),
        path: path ? String(path) : null,
        referrer: referrer ? String(referrer) : null,
        device: device ? String(device) : null,
        locale: locale ? String(locale) : null,
        utm: utm ?? undefined,
        source: cls.source ?? undefined,
        medium: cls.medium ?? undefined,
        campaign: cls.campaign ?? undefined,
        channel: cls.channel ?? undefined,
      } as any,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("analytics.track error", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export const POST = withAudit(
  "analytics.track",
  _POST,
  async () => ({ type: "AnalyticsEvent", id: null }),
  "json",
);

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}