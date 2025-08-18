import { requireRole } from "@/lib/require-auth";
import { prisma } from "@/lib/prisma";
import AdminsManager from "./ui/AdminsManager";

export const dynamic = "force-dynamic";

function fmtKZ(d: Date | null | undefined) {
  if (!d) return null;
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Almaty",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
}

export default async function AdminsPage() {
  const session = await requireRole();
  const role = String((session.user as any)?.role || "VIEWER").toUpperCase();
  const canManage = role === "ADMIN";

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  const initial = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    image: u.image ?? null,

    createdAtISO: u.createdAt.toISOString(),
    createdAtDisplay: fmtKZ(u.createdAt) ?? "",

    lastLoginAtISO: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    lastLoginAtDisplay: u.lastLoginAt ? fmtKZ(u.lastLoginAt) : null,
  }));

  return <AdminsManager initial={initial} canManage={canManage} />;
}