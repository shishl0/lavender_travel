import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { withAudit } from "@/lib/audit";
import { requireRole } from "@/lib/require-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { keyFromUrl, publicUrlForKey, s3DeleteByKey, s3PutObject, getUploadPrefix } from "@/lib/s3";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Оригиналы, которые разрешаем сохранять как есть для ADMIN/EDITOR.
 * (для гостей — конвертируем в PNG/JPEG, кроме анимированного GIF)
 */
const ALLOWED_ORIGINAL = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/avif",
  "image/tiff",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

const MAX_INPUT_BYTES = 30 * 1024 * 1024; // 30MB
const DAILY_LIMIT_PUBLIC = 5;

// ---------- utils ----------

function extByType(t: string) {
  switch (t) {
    case "image/png": return ".png";
    case "image/jpeg": return ".jpg";
    case "image/webp": return ".webp";
    case "image/gif": return ".gif";
    case "image/heic":
    case "image/heif": return ".heic";
    case "image/avif": return ".avif";
    case "image/tiff": return ".tiff";
    case "application/pdf": return ".pdf";
    case "application/msword": return ".doc";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": return ".docx";
    default: return "";
  }
}

function getClientIp(req: Request) {
  const h = req.headers;
  const xff = h.get("x-forwarded-for");
  return (
    xff?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    h.get("x-client-ip") ||
    "0.0.0.0"
  );
}

function rlDateKey(d = new Date()) {
  // YYYY-MM-DD
  return d.toISOString().slice(0, 10);
}
function rlKey(req: Request) {
  const ip = getClientIp(req);
  const ua = req.headers.get("user-agent") || "-";
  return `${ip}|${ua.slice(0, 80)}`;
}

const RL_DIR = path.join(process.cwd(), ".data", "ratelimits");
async function ensureDir(p: string) {
  try { await fs.mkdir(p, { recursive: true }); } catch {}
}
type RLMap = Record<string, number>;

// in-memory запасной вариант
const globalMem: { key: string; map: Map<string, number> } =
  (globalThis as any).__UP_RL ?? ((globalThis as any).__UP_RL = { key: rlDateKey(), map: new Map() });

async function rlRead(dateKey: string): Promise<RLMap | null> {
  try {
    await ensureDir(RL_DIR);
    const file = path.join(RL_DIR, `uploads-${dateKey}.json`);
    const buf = await fs.readFile(file).catch(() => null);
    if (!buf) return {};
    const json = JSON.parse(buf.toString());
    return json && typeof json === "object" ? (json as RLMap) : {};
  } catch {
    return null;
  }
}
async function rlWrite(dateKey: string, data: RLMap): Promise<boolean> {
  try {
    await ensureDir(RL_DIR);
    const file = path.join(RL_DIR, `uploads-${dateKey}.json`);
    await fs.writeFile(file, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
async function rlGetCount(req: Request) {
  const key = rlKey(req);
  const dk = rlDateKey();
  const fileData = await rlRead(dk);
  if (fileData) return { dateKey: dk, key, count: fileData[key] || 0, src: "file" as const };

  if (globalMem.key !== dk) {
    globalMem.key = dk;
    globalMem.map = new Map<string, number>();
  }
  return { dateKey: dk, key, count: globalMem.map.get(key) || 0, src: "mem" as const };
}
async function rlInc(dateKey: string, key: string, src: "file" | "mem") {
  if (src === "file") {
    const data = (await rlRead(dateKey)) || {};
    data[key] = (data[key] || 0) + 1;
    const ok = await rlWrite(dateKey, data);
    if (ok) return true;

    // fallback в память
    globalMem.key = dateKey;
    globalMem.map.set(key, (globalMem.map.get(key) || 0) + 1);
    return true;
  }
  if (globalMem.key !== dateKey) {
    globalMem.key = dateKey;
    globalMem.map = new Map<string, number>();
  }
  globalMem.map.set(key, (globalMem.map.get(key) || 0) + 1);
  return true;
}
function tooManyResponse(remaining: number) {
  const resetAt = new Date();
  resetAt.setUTCHours(24, 0, 0, 0);
  const seconds = Math.max(1, Math.floor((resetAt.getTime() - Date.now()) / 1000));

  const res = NextResponse.json({
    ok: false,
    error: "Upload limit reached",
    message: "Вы загрузили максимум 5 фото за сегодня. Попробуйте завтра или войдите как редактор.",
    limit: DAILY_LIMIT_PUBLIC,
    remaining: Math.max(0, remaining),
    resetSeconds: seconds,
  }, { status: 429 });

  res.headers.set("Retry-After", String(seconds));
  return res;
}

async function readIncomingFile(req: Request) {
  // Поддерживаем multipart/form-data и "сырое" тело (image/* или application/octet-stream)
  const ctype = (req.headers.get("content-type") || "").toLowerCase();
  if (ctype.startsWith("multipart/form-data")) {
    const form = await req.formData();
    const f = form.get("file") as File | null;
    if (!f) return { bytes: Buffer.alloc(0), type: "", name: "" };
    const bytes = Buffer.from(await f.arrayBuffer());
    return { bytes, type: f.type || ctype.split(";")[0], name: (f as any)?.name || "" };
  }

  const bytes = Buffer.from(await req.arrayBuffer());
  const type = (ctype.split(";")[0] || "application/octet-stream").toLowerCase();
  const name = req.headers.get("x-filename") || `upload${extByType(type) || ""}`;
  return { bytes, type, name };
}

// ---------- POST ----------
async function _POST(req: Request) {
  
  // Роль пользователя
  const session = await getServerSession(authOptions).catch(() => null);
  const role = String((session?.user as any)?.role || "").toUpperCase();
  const isPrivileged = role === "ADMIN" || role === "EDITOR";

  try {
    // Проверяем конфигурацию S3
    const hasS3 = !!(process.env.S3_BUCKET && (process.env.S3_REGION || process.env.AWS_REGION));
    if (!hasS3) {
      return NextResponse.json({ error: "Uploads storage not configured" }, { status: 501 });
    }

    // Rate limit для гостей
    let rlInfo: { dateKey: string; key: string; count: number; src: "file" | "mem" } | null = null;
    if (!isPrivileged) {
      rlInfo = await rlGetCount(req);
      const remaining = DAILY_LIMIT_PUBLIC - rlInfo.count;
      if (remaining <= 0) return tooManyResponse(remaining);
    }

    const { bytes, type: incomingType } = await readIncomingFile(req);
    if (!bytes?.length) return NextResponse.json({ error: "No file" }, { status: 400 });

    if (bytes.length > MAX_INPUT_BYTES) {
      return NextResponse.json({ error: "File is too large (max 30MB)" }, { status: 413 });
    }

    // === PDF/документы — без преобразований ===
    if (incomingType === "application/pdf") {
      const key = `${getUploadPrefix()}/${Date.now()}-${randomUUID()}.pdf`;
      const url = await s3PutObject(key, bytes, "application/pdf", "public, max-age=31536000, immutable");
      if (rlInfo) await rlInc(rlInfo.dateKey, rlInfo.key, rlInfo.src);
      return NextResponse.json({ ok: true, url, contentType: "application/pdf" });
    }
    // === Ветка ADMIN/EDITOR — сохраняем оригинал без перекодирования ===
    if (isPrivileged) {
      let ct = incomingType;
      let ext = extByType(ct);

      try {
        // Если тип не узнали — попробуем прочитать метаданные через sharp
        if (!ext) {
          const sharp = (await import("sharp")).default;
          const meta = await sharp(bytes, { failOn: "none" }).metadata();
          switch (meta.format) {
            case "jpeg": ct = "image/jpeg"; ext = ".jpg"; break;
            case "png":  ct = "image/png";  ext = ".png"; break;
            case "webp": ct = "image/webp"; ext = ".webp"; break;
            case "gif":  ct = "image/gif";  ext = ".gif"; break;
            case "heif": ct = "image/heic"; ext = ".heic"; break;
            case "avif": ct = "image/avif"; ext = ".avif"; break;
            case "tiff": ct = "image/tiff"; ext = ".tiff"; break;
            default: break;
          }
        }
      } catch {
        // sharp недоступен — ничего страшного, попробуем с текущим ext
      }

      if (!ext) {
        return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
      }

      const key = `${getUploadPrefix()}/${Date.now()}-${randomUUID()}${ext}`;
      const url = await s3PutObject(key, bytes, ct);
      if (rlInfo) await rlInc(rlInfo.dateKey, rlInfo.key, rlInfo.src);
      return NextResponse.json({ ok: true, url, contentType: ct });
    }

    // === Ветка гостей — конвертация + мягкое сжатие (без «шакалов») ===
    try {
      const sharp = (await import("sharp")).default;

      // Узнаём входной формат и анимацию
      const meta = await sharp(bytes, { failOn: "none" }).metadata();
      const isAnimatedGif = meta.format === "gif" && ((meta.pages || 1) > 1);

      // Анимированный GIF — оставляем как есть (загружаем в S3 без перекодирования)
      if (isAnimatedGif) {
        const key = `${getUploadPrefix()}/${Date.now()}-${randomUUID()}.gif`;
        const url = await s3PutObject(key, bytes, "image/gif");
        if (rlInfo) await rlInc(rlInfo.dateKey, rlInfo.key, rlInfo.src);
        return NextResponse.json({ ok: true, url, contentType: "image/gif" });
      }

      // Нормализуем ориентацию и ограничим размер (достаточно для экранов)
      const MAX_DIM = 2560;
      let pipeline = sharp(bytes, { failOn: "none" })
        .rotate() // по EXIF
        .resize({
          width: MAX_DIM,
          height: MAX_DIM,
          fit: "inside",
          withoutEnlargement: true,
        });

      // Если есть альфа — PNG, иначе JPEG
      const hasAlpha = !!meta.hasAlpha;
      let outExt = hasAlpha ? ".png" : ".jpg";
      let outType = hasAlpha ? "image/png" : "image/jpeg";

      if (hasAlpha) {
        pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
      } else {
        pipeline = pipeline.jpeg({
          quality: 82, // «мягкое» сжатие: заметной деградации не будет
          mozjpeg: true,
          chromaSubsampling: "4:2:0",
        } as any);
      }

      const out = await pipeline.toBuffer();
      const key = `${getUploadPrefix()}/${Date.now()}-${randomUUID()}${outExt}`;
      const url = await s3PutObject(key, out, outType);

      if (rlInfo) await rlInc(rlInfo.dateKey, rlInfo.key, rlInfo.src);
      return NextResponse.json({ ok: true, url, contentType: outType });
    } catch (e) {
      console.error("sharp/convert error:", e);
      // Не сохраним экзотические форматы без преобразования — лучше вернуть ошибку
      return NextResponse.json({ error: "Image processing unavailable" }, { status: 500 });
    }
  } catch (e) {
    console.error("upload error", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// ---------- DELETE (ADMIN/EDITOR) ----------
async function _DELETE(req: Request) {
  await requireRole(["ADMIN", "EDITOR"]);

  try {
    const { url } = (await req.json().catch(() => ({}))) as { url?: string };
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Bad url" }, { status: 400 });
    }

    // Пытаемся удалить из S3, если URL распознан
    const key = keyFromUrl(url);
    if (key) {
      try { await s3DeleteByKey(key); } catch {}
    }

    // Бэкап: удаление локального файла, если вдруг ещё остался
    if (url.startsWith("/uploads/")) {
      try {
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        const candidate = path.normalize(path.join(process.cwd(), "public", url));
        if (candidate.startsWith(uploadsDir)) {
          try { await fs.unlink(candidate); } catch {}
        }
      } catch {}
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("upload delete error", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export const POST = withAudit(
  "upload.create",
  _POST,
  async () => ({ type: "Upload", id: null }),
  "none",
);

export const DELETE = withAudit(
  "upload.delete",
  _DELETE,
  async (_req, _ctx, payload?: { url?: string } | null) => ({
    type: "Upload",
    id: payload?.url ?? null,
  }),
  "json",
);

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
