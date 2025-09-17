import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getS3, keyFromUrl } from "@/lib/s3";

export const dynamic = "force-dynamic";

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function POST(req: Request) {
  try {
    const { url } = (await req.json().catch(() => ({}))) as { url?: string };
    if (!url || typeof url !== "string") return bad("Provide url", 400);

    let bytes: Buffer | null = null;

    if (url.startsWith("/uploads/")) {
      // Локальная совместимость (dev) с фоллбеком в S3
      const pubDir = path.join(process.cwd(), "public");
      const abs = path.normalize(path.join(pubDir, url));
      const uploadsDir = path.join(pubDir, "uploads");
      if (!abs.startsWith(uploadsDir)) return bad("Forbidden path", 403);
      try {
        bytes = await fs.readFile(abs);
      } catch (e) {
        // Файл локально отсутствует — пробуем достать из S3 по ключу
        try {
          const key = keyFromUrl(url);
          const bucket = process.env.S3_BUCKET || "";
          if (key && bucket) {
            const s3 = getS3();
            const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
            const stream = obj.Body as unknown as NodeJS.ReadableStream | null;
            if (!stream) throw new Error("Empty S3 body");
            bytes = await new Promise<Buffer>((resolve, reject) => {
              const chunks: Buffer[] = [];
              stream.on("data", (c: Buffer) => chunks.push(Buffer.from(c)));
              stream.on("error", reject);
              stream.on("end", () => resolve(Buffer.concat(chunks)));
            });
          } else {
            return bad("File not found", 404);
          }
        } catch (e2) {
          console.error("render-docx s3 fallback error", e2);
          return bad("File not found", 404);
        }
      }
    } else if (/^https?:\/\//i.test(url)) {
      // Попытка скачать из S3 (предпочтительно через SDK, иначе HTTP)
      try {
        const key = keyFromUrl(url);
        const bucket = process.env.S3_BUCKET || "";
        if (key && bucket) {
          const s3 = getS3();
          const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
          const stream = obj.Body as unknown as NodeJS.ReadableStream | null;
          if (!stream) throw new Error("Empty S3 body");
          bytes = await new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = [];
            stream.on("data", (c: Buffer) => chunks.push(Buffer.from(c)));
            stream.on("error", reject);
            stream.on("end", () => resolve(Buffer.concat(chunks)));
          });
        } else {
          // Падает назад на HTTP GET (если объект публичный)
          const res = await fetch(url);
          if (!res.ok) return bad("Fetch failed", 400);
          const arr = new Uint8Array(await res.arrayBuffer());
          bytes = Buffer.from(arr);
        }
      } catch (e) {
        console.error("render-docx s3/http fetch error", e);
        return bad("Download failed", 400);
      }
    } else {
      return bad("Unsupported URL", 400);
    }

    if (!bytes) return bad("Empty file", 400);

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
