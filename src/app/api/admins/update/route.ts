import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withAudit } from "@/lib/audit";
import { formatDateTime } from "@/lib/tz";
import type { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

function mapUser(u: any) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    image: u.image ?? null,
    createdAtISO: u.createdAt.toISOString(),
    createdAtDisplay: formatDateTime(u.createdAt) ?? "",
    lastLoginAtISO: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    lastLoginAtDisplay: u.lastLoginAt ? formatDateTime(u.lastLoginAt) : null,
  };
}

async function postHandler(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const myRole = String((session?.user as any)?.role || "VIEWER").toUpperCase();
    if (myRole !== "ADMIN") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { id, email, name, role } = (await req.json()) as {
      id?: string;
      email?: string;
      name?: string | null;
      role?: string;
    };

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const ALLOWED: readonly Role[] = ["ADMIN", "EDITOR", "VIEWER"] as const;
    const roleValue: Role | undefined =
      typeof role === "string" && ALLOWED.includes(role.toUpperCase() as Role)
        ? (role.toUpperCase() as Role)
        : undefined;

    const user = await prisma.user.update({
      where: { id },
      data: {
        email: typeof email === "string" ? email.toLowerCase().trim() : undefined,
        name: typeof name === "string" ? (name.trim() || null) : undefined,
        ...(roleValue ? { role: roleValue } : {}),
        // Альтернатива: ...(roleValue ? { role: { set: roleValue } } : {}),
      },
    });

    return NextResponse.json({ user: mapUser(user) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

export const POST = withAudit(
  "admins.update",
  postHandler,
  (_req: Request, _ctx: unknown, payload?: { id?: string } | null) => ({
    type: "User",
    id: payload?.id ?? null,
  }),
  "json",
);