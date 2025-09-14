import { requireRole } from "@/lib/require-auth";
import { prisma } from "@/lib/prisma";
import ReviewsManager from "./ui/ReviewsManager";

export const dynamic = "force-dynamic";

const TZ = process.env.APP_TIMEZONE || "Asia/Almaty";
function fmtLocal(d: Date | null | undefined) {
  if (!d) return null;
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const toRating = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? clamp(Math.round(n), 1, 5) : 5;
};

export default async function ReviewsPage() {
  const session = await requireRole(["ADMIN", "EDITOR"]);
  const role = String((session.user as any)?.role || "VIEWER").toUpperCase();
  const canDelete = role === "ADMIN";
  const canEdit = role === "ADMIN" || role === "EDITOR";

  const rows = await prisma.review.findMany({ orderBy: { createdAt: "desc" } });

  const initial = rows.map((r) => ({
    id: r.id,
    name: r.name,
    text: r.text,
    images: r.images,
    rating: toRating(r.rating),
    isActive: r.isActive,
    createdAtISO: r.createdAt.toISOString(),
    updatedAtISO: r.updatedAt.toISOString(),
    createdAtDisplay: fmtLocal(r.createdAt) ?? "",
    updatedAtDisplay: fmtLocal(r.updatedAt) ?? "",
  }));

  return <ReviewsManager initial={initial} canEdit={canEdit} canDelete={canDelete} />;
}