// src/lib/s3.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const S3_REGION = process.env.S3_REGION || process.env.AWS_REGION || "";
const S3_BUCKET = process.env.S3_BUCKET || "";
const S3_PUBLIC_URL_BASE = (process.env.S3_PUBLIC_URL_BASE || "").replace(/\/$/, "");
const S3_UPLOAD_PREFIX = (process.env.S3_UPLOAD_PREFIX || "uploads").replace(/^\/+|\/+$/g, "");
const S3_ENDPOINT = process.env.S3_ENDPOINT || undefined; // опц.: для S3-совместимых хранилищ

let _s3: S3Client | null = null;
export function getS3() {
  if (_s3) return _s3;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || "";
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || "";
  _s3 = new S3Client({
    region: S3_REGION || undefined,
    endpoint: S3_ENDPOINT,
    credentials: accessKeyId && secretAccessKey
      ? { accessKeyId, secretAccessKey }
      : undefined,
    forcePathStyle: !!S3_ENDPOINT, // полезно для minio/совместимых
  });
  return _s3;
}

export function getUploadPrefix() {
  return S3_UPLOAD_PREFIX;
}

export function publicUrlForKey(key: string) {
  const k0 = key.replace(/^\/+/, "");
  if (S3_PUBLIC_URL_BASE) {
    try {
      const base = new URL(S3_PUBLIC_URL_BASE);
      const basePath = base.pathname.replace(/^\/+|\/+$/g, "");
      let k = k0;
      if (basePath && (k0 === basePath || k0.startsWith(basePath + "/"))) {
        // избегаем дублирования пути, если base уже включает префикс
        k = k0.slice(basePath.length).replace(/^\/+/, "");
      }
      const pathPart = [base.pathname.replace(/\/$/, ""), k].filter(Boolean).join("/");
      return `${base.origin}${pathPart.startsWith("/") ? "" : "/"}${pathPart}`;
    } catch {
      // если base невалиден — падать не будем
      return `${S3_PUBLIC_URL_BASE}/${k0}`;
    }
  }
  if (S3_BUCKET && S3_REGION) return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${k0}`;
  // fallback — локальный URL (на случай dev без S3), не используем в прод
  return `/${k0}`;
}

export async function s3PutObject(
  key: string,
  body: Buffer,
  contentType: string,
  cacheControl = "public, max-age=31536000, immutable"
) {
  if (!S3_BUCKET) throw new Error("S3_BUCKET is not set");
  const s3 = getS3();
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key.replace(/^\//, ""),
    Body: body,
    ContentType: contentType,
    CacheControl: cacheControl,
    ACL: undefined, // используйте политику бакета/CloudFront OAC; не рекомендуем public-read через ACL
  }));
  return publicUrlForKey(key);
}

export async function s3DeleteByKey(key: string) {
  if (!S3_BUCKET) throw new Error("S3_BUCKET is not set");
  const s3 = getS3();
  await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key.replace(/^\//, "") }));
  return true;
}

export function keyFromUrl(url: string): string | null {
  if (!url) return null;
  try {
    // локальный путь
    if (url.startsWith("/uploads/")) return url.replace(/^\//, "");

    // базовый публичный URL (может включать префикс, например /photos)
    const fallbackBase = S3_BUCKET && S3_REGION ? `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com` : "";
    const base = S3_PUBLIC_URL_BASE || fallbackBase;
    if (base && url.startsWith(base)) {
      const u = new URL(url);
      const baseU = new URL(base);
      if (u.hostname !== baseU.hostname) return null;
      // Берём полный путь из URL, убираем ведущий слэш — это и есть ключ в бакете
      return u.pathname.replace(/^\/+/, "");
    }
  } catch {}
  return null;
}
