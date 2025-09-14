import { NextResponse } from "next/server";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { buildSnapshot } from "@/lib/cms-cache";
import { withAudit } from "@/lib/audit";
import { requireRole } from "@/lib/require-auth";

async function _POST(req: Request) {
  await requireRole(["ADMIN", "EDITOR"]);
  const data = await buildSnapshot();
  const file = path.join(process.cwd(), "public", "cms-snapshot.json");
  await writeFile(file, JSON.stringify(data, null, 2), "utf8");
  return NextResponse.json({ ok: true, file: "/cms-snapshot.json" });
}

export const POST = withAudit("cms.snapshot.build", _POST);
export async function GET() { return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 }); }