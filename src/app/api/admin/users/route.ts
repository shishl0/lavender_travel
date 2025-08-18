import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { auditLog } from "@/lib/audit";

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user?.email || role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const startedAt = Date.now();
  try {
    const session = await ensureAdmin();
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { email, name, password, role } = (await req.json()) as {
      email: string; name?: string | null; password: string; role?: string;
    };

    if (!email || !password) {
      return NextResponse.json({ error: "email & password required" }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (exists) return NextResponse.json({ error: "Email already exists" }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 10);

    const u = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name ?? null,
        passwordHash,
        role: role === "EDITOR" || role === "VIEWER" ? role : "ADMIN",
      },
      select: { id: true },
    });

    // Аудит
    await auditLog({
      req,
      action: "admin.users.create",
      target: { type: "User", id: u.id },
      payload: { email, name: name ?? null, role: role ?? "ADMIN" },
      startedAt,
    });

    return NextResponse.json({ ok: true, id: u.id });
  } catch (e: any) {
    await auditLog({
      req,
      action: "admin.users.create",
      status: "ERROR",
      error: e?.message || String(e),
      startedAt,
    });
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}