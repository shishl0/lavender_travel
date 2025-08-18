import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { withAudit } from "@/lib/audit";
import { requireRole } from "@/lib/require-auth";

export const dynamic = "force-dynamic";

async function _POST(req: Request) {
  await requireRole(["ADMIN", "EDITOR"]); 

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const allowed = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const ext =
      file.type === "image/png" ? ".png" :
      file.type === "image/jpeg" ? ".jpg" :
      file.type === "image/webp" ? ".webp" :
      file.type === "image/gif" ? ".gif" : "";

    const filename = `${Date.now()}-${randomUUID()}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    await fs.writeFile(filepath, bytes);

    const url = `/uploads/${filename}`;
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    console.error("upload error", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export const POST = withAudit(
  "upload.create",
  _POST,
  async () => ({ type: "Upload", id: null }),
  "none",
);

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}