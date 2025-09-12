import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export const dynamic = "force-dynamic";

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function POST(req: Request) {
  try {
    const { url } = (await req.json().catch(() => ({}))) as { url?: string };
    if (!url || typeof url !== "string") return bad("Provide url", 400);

    // Разрешаем только локальные файлы в /public/uploads
    if (!url.startsWith("/uploads/")) return bad("Only local /uploads/ paths allowed", 400);
    const pubDir = path.join(process.cwd(), "public");
    const abs = path.normalize(path.join(pubDir, url));
    const uploadsDir = path.join(pubDir, "uploads");
    if (!abs.startsWith(uploadsDir)) return bad("Forbidden path", 403);

    const bytes = await fs.readFile(abs);

    let mammoth: any;
    try {
      mammoth = (await import("mammoth")).default ?? (await import("mammoth"));
    } catch (e) {
      return NextResponse.json({ ok: false, error: "mammoth_not_installed" }, { status: 500 });
    }

    const result = await mammoth.convertToHtml({ buffer: bytes }, {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
      ],
      convertImage: mammoth.images.inline(async (elem: any) => {
        try {
          const b64 = await elem.read("base64");
          return { src: `data:${elem.contentType};base64,${b64}` };
        } catch {
          return {} as any;
        }
      }),
    });
    const html = String(result?.value || "");
    return NextResponse.json({ ok: true, html });
  } catch (e) {
    console.error("render-docx error", e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
