import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withAudit } from "@/lib/audit";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

type Role = "ADMIN" | "EDITOR" | "VIEWER";

async function postHandler(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = ((session?.user as { role?: Role } | undefined)?.role ?? "VIEWER") as Role;
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    type Body = { id?: string; newPassword?: string };
    const { id, newPassword } = (await req.json()) as Body;
    if (!id || !newPassword) {
      return NextResponse.json({ error: "id/newPassword required" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id }, data: { passwordHash } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

export const POST = withAudit(
  "admins.resetPassword",
  postHandler,
  (_req: Request, _ctx: unknown, payload?: { id?: string } | null) => ({
    type: "User",
    id: payload?.id ?? null,
  }),
  "json",
);