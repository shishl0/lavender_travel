import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { auditLog } from "@/lib/audit";

type Role = "ADMIN" | "EDITOR" | "VIEWER";

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: Role } | undefined)?.role;
  if (!session?.user?.email || role !== "ADMIN") {
    return null;
  }
  return session;
}

function getIdFromReq(req: Request): string | null {
  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    // .../api/admin/users/:id
    const id = parts[parts.length - 1];
    return id || null;
  } catch {
    return null;
  }
}

export async function PATCH(req: Request) {
  const startedAt = Date.now();
  const id = getIdFromReq(req);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    const session = await ensureAdmin();
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    type Body = { name?: string; role?: Role; password?: string };
    const body = (await req.json()) as Partial<Body>;

    // снимок "до"
    const before = await prisma.user.findUnique({
      where: { id },
      select: { name: true, role: true },
    });

    const data: Record<string, unknown> = {};
    if (typeof body.name === "string") data.name = body.name || null;
    if (typeof body.role === "string" && ["ADMIN", "EDITOR", "VIEWER"].includes(body.role)) {
      data.role = body.role as Role;
    }
    if (typeof body.password === "string" && body.password.length >= 6) {
      data.passwordHash = await bcrypt.hash(body.password, 10);
    }

    if (!Object.keys(data).length) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    await prisma.user.update({ where: { id }, data });

    // diff (шаллоу)
    const diff: Record<string, [unknown, unknown]> = {};
    if ("name" in data && (before?.name ?? null) !== data.name) {
      diff.name = [before?.name ?? null, data.name];
    }
    if ("role" in data && before?.role !== data.role) {
      diff.role = [before?.role ?? null, data.role];
    }
    if ("passwordHash" in data) {
      diff.password = ["***", "***"];
    }

    await auditLog({
      req,
      action: "admin.users.update",
      target: { type: "User", id },
      payload: { provided: Object.keys(body ?? {}) },
      diff,
      startedAt,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    await auditLog({
      req,
      action: "admin.users.update",
      status: "ERROR",
      error: e instanceof Error ? e.message : String(e),
      target: { type: "User", id },
      startedAt,
    });
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const startedAt = Date.now();
  const id = getIdFromReq(req);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    const session = await ensureAdmin();
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.user.delete({ where: { id } });

    await auditLog({
      req,
      action: "admin.users.delete",
      target: { type: "User", id },
      startedAt,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    await auditLog({
      req,
      action: "admin.users.delete",
      status: "ERROR",
      error: e instanceof Error ? e.message : String(e),
      target: { type: "User", id },
      startedAt,
    });
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}