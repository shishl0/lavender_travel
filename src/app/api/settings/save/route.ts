import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateSettings } from "@/lib/cms-cache";
import { withAudit } from "@/lib/audit";
import { requireRole } from "@/lib/require-auth";

export const dynamic = "force-dynamic";

async function _POST(req: Request) {
  await requireRole(["ADMIN", "EDITOR"]);

  try {
    const {
      id,
      brandName,
      brandTagline,
      metaTitle,
      metaDescription,
      ogImageUrl,
      whatsappNumber,
      instagramUrl,
    } = await req.json();

    if (!brandName || !metaTitle || !metaDescription) {
      return NextResponse.json(
        { ok: false, error: "Required fields missing" },
        { status: 400 }
      );
    }

    let created: { id: string } | null = null;

    if (id) {
      await prisma.siteSettings.update({
        where: { id },
        data: {
          brandName,
          brandTagline,
          metaTitle,
          metaDescription,
          ogImageUrl,
          whatsappNumber,
          instagramUrl,
        },
      });
    } else {
      created = await prisma.siteSettings.create({
        data: {
          isActive: false,
          brandName,
          brandTagline,
          metaTitle,
          metaDescription,
          ogImageUrl,
          whatsappNumber,
          instagramUrl,
        },
      });
    }

    invalidateSettings();

    return NextResponse.json({ ok: true, id: created?.id || id || null });
  } catch (e) {
    console.error("settings/save error", e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

export const POST = withAudit(
  "settings.save",
  _POST,
  (_req, _ctx, payload) => ({ type: "SiteSettings", id: payload?.id ?? null }),
  "json"
);

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}