import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateSettings } from "@/lib/cms-cache";
import { withAudit } from "@/lib/audit";
import { requireRole } from "@/lib/require-auth";

export const dynamic = "force-dynamic";

// лёгкие нормалайзеры
const isISO = (s: unknown) => typeof s === "string" && !Number.isNaN(Date.parse(s));
const asURLorNull = (s: unknown) => (typeof s === "string" && s.trim() ? s.trim() : null);
const asNullable = (v: unknown) => (v === undefined ? null : (v as any));

async function _POST(req: Request) {
  await requireRole(["ADMIN", "EDITOR"]);

  try {
    const body = await req.json();

    const {
      id,
      // Бренд/мета/контакты (как было)
      brandName,
      brandTagline,
      metaTitle,
      metaDescription,
      ogImageUrl,
      whatsappNumber,
      instagramUrl,
      // ==== NEW: статы/опыт ====
      statsClients,
      statsRating,
      inTourismSince,       // может приходить Date/ISO из формы
      statsMode,            // 'shown' | 'hidden'
      // ==== NEW: адрес/доки ====
      address,              // {ru,kk,en}
      certificateUrl,
      // ==== NEW: политики (rich HTML) ====
      privacyPolicy,        // Localized rich JSON
      termsOfService,       // Localized rich JSON
      // ==== NEW: политики (DOCX ссылки по языкам) ====
      privacyPolicyDocUrls,
      termsOfServiceDocUrls,
      // ==== (pricing fields removed — not in schema) ====
    } = body ?? {};

    if (!brandName || !metaTitle || !metaDescription) {
      return NextResponse.json({ ok: false, error: "Required fields missing" }, { status: 400 });
    }

    // приведение типов (мягко)
    const sanitizeDocUrls = (v: any) => {
      if (!v || typeof v !== "object") return null;
      const out: any = {};
      const set = (k: "ru" | "kk" | "en") => {
        const s = v?.[k];
        if (typeof s === "string" && s.trim()) out[k] = s.trim();
      };
      set("ru"); set("kk"); set("en");
      return Object.keys(out).length ? out : null;
    };
    const data: any = {
      brandName: String(brandName),
      brandTagline: typeof brandTagline === "string" && brandTagline.trim() ? brandTagline : null,

      metaTitle: String(metaTitle),
      metaDescription: String(metaDescription),
      ogImageUrl: asURLorNull(ogImageUrl),

      whatsappNumber: typeof whatsappNumber === "string" ? whatsappNumber.trim() : null,
      instagramUrl: asURLorNull(instagramUrl),

      // NEW stats/experience
      statsClients: Number.isFinite(Number(statsClients)) ? Number(statsClients) : null,
      statsRating: Number.isFinite(Number(statsRating)) ? Number(statsRating) : null,
      inTourismSince: isISO(inTourismSince) ? new Date(inTourismSince) : (inTourismSince instanceof Date ? inTourismSince : null),

      statsMode: typeof statsMode === "string" ? statsMode : null,

      // NEW address/docs
      address: address ?? null,
      certificateUrl: asURLorNull(certificateUrl),

      // NEW policies
      privacyPolicy: asNullable(privacyPolicy),
      termsOfService: asNullable(termsOfService),
      privacyPolicyDocUrls: sanitizeDocUrls(privacyPolicyDocUrls),
      termsOfServiceDocUrls: sanitizeDocUrls(termsOfServiceDocUrls),
    };

    let created: { id: string } | null = null;

    if (id) {
      await prisma.siteSettings.update({
        where: { id: String(id) },
        data,
      });
    } else {
      created = await prisma.siteSettings.create({
        data: { isActive: false, ...data },
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
  "json",
);

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
