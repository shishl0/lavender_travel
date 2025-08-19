import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withAudit } from "@/lib/audit";
import { formatDateTime } from "@/lib/tz";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

type Role = "ADMIN" | "EDITOR" | "VIEWER";
type PrismaUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  image: string | null;
  createdAt: Date;
  lastLoginAt: Date | null;
};

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
    const role = String(((session?.user as { role?: Role } | undefined)?.role ?? "VIEWER")).toUpperCase();
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    type Body = {
      email: string;
      name?: string;
      role?: Role;
      password: string;
    };

    const { email, name, role: newRole = "EDITOR", password } = (await req.json()) as Body;

    if (!email || !password) {
      return NextResponse.json({ error: "email/password required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (exists) return NextResponse.json({ error: "email exists" }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = (await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name?.trim() || null,
        role: newRole,
        passwordHash,
      },
    })) as PrismaUser;

    return NextResponse.json({ user: mapUser(user) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

export const POST = withAudit(
  "admins.create",
  postHandler,
  () => ({ type: "User", id: null }),
  "json",
);